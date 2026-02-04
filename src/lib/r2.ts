import { S3 } from "@aws-sdk/client-s3"
import DB from "./db";

let s3Client: S3 | null = null;

function getS3Client() {
    if (!s3Client) {
        s3Client = new S3({
            endpoint: `https://${process.env.ACCOUNT_ID}.eu.r2.cloudflarestorage.com`, 
            region: "eeur", 
            credentials: {
                accessKeyId: process.env.ACCESS_KEY_ID!,
                secretAccessKey: process.env.SECRET_ACCESS_KEY!
            }
        });
    }
    return s3Client;
}

export async function getFiles() {

    if (!s3Client) s3Client = getS3Client();

    const data = await s3Client.listObjectsV2({ Bucket: "limbo-bucket" });
    return data;

}

export async function getFile(key: string) {

    if (!s3Client) s3Client = getS3Client();

    const data = await s3Client.getObject({ Bucket: "limbo-bucket", Key: key });
    return data;

}

export async function putFile(user_id: string, name: string, location: string, body: Uint8Array | Buffer | Blob | string) {
    
    if (!s3Client) s3Client = getS3Client();

    const key = crypto.randomUUID();

    const data = await s3Client.putObject({ Bucket: "limbo-bucket", Key: key, Body: body });

    const query = `INSERT INTO files (user_id, filename, filepath) VALUES ($1, $2, $3) RETURNING id`;
    const values = [user_id, name, key];
    const response = await DB(query, values); 

    if (response === -1) {
        throw new Error("Database insertion failed");
    }
    
    return { s3Data: data, fileId: response[0].id, s3Key: key };

}

export async function deleteFile(key: string) {

    if (!s3Client) s3Client = getS3Client();

    await s3Client.deleteObject({ Bucket: "limbo-bucket", Key: key });

    const query = `DELETE FROM files WHERE filepath = $1`;
    const values = [key];
    await DB(query, values);


}

export async function fileExists(key: string) {

    if (!s3Client) s3Client = getS3Client();
    
    try {
        await s3Client.headObject({ Bucket: "limbo-bucket", Key: key });
        return true;
    } catch (_error) {
        return false;
    }

}

export async function renameFile(oldKey: string, newKey: string) {
    if (!s3Client) s3Client = getS3Client();

    await s3Client.copyObject({
        Bucket: "limbo-bucket",
        CopySource: `limbo-bucket/${oldKey}`,
        Key: newKey
    });

    await s3Client.deleteObject({
        Bucket: "limbo-bucket",
        Key: oldKey
    });

    const query = `UPDATE files SET filepath = $1 WHERE filepath = $2`;
    const values = [newKey, oldKey];
    await DB(query, values);

}