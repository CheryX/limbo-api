import { S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";
import DB from "./db";

let s3Client: S3 | null = null;
const BUCKET_NAME = process.env.BUCKET_NAME || "limbo-bucket";

function getS3Client() {
    if (!s3Client) {
        s3Client = new S3({
            endpoint: `https://${process.env.ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
            region: "auto",
            credentials: {
                accessKeyId: process.env.ACCESS_KEY_ID!,
                secretAccessKey: process.env.SECRET_ACCESS_KEY!
            }
        });
    }
    return s3Client;
}

export const r2Client = getS3Client();

export async function getFile(key: string) {
    if (!s3Client) s3Client = getS3Client();

    if (await fileExists(key)) 
        return await s3Client.getObject({ Bucket: BUCKET_NAME, Key: key });

    return -1;
}

export async function uploadFile(key: string, body: Readable, contentType: string) {
    const client = getS3Client();
    
    const parallelUploads3 = new Upload({
        client,
        params: { 
            Bucket: BUCKET_NAME, 
            Key: key, 
            Body: body,
            ContentType: contentType 
        },
        queueSize: 4, 
        partSize: 1024 * 1024 * 5, 
    });

    return await parallelUploads3.done();
}

export async function fileExists(key: string) {
    if (!s3Client) s3Client = getS3Client();
    try {
        await s3Client.headObject({ Bucket: BUCKET_NAME, Key: key });
        return true;
    } catch (_error) {
        return false;
    }
}

export async function renameFile(oldKey: string, newKey: string) {
    if (!s3Client) s3Client = getS3Client();

    const query = `UPDATE files SET filepath = $1 WHERE filepath = $2`;
    const values = [newKey, oldKey];
    await DB(query, values);
}