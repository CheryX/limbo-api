import { DeleteObjectCommand, GetObjectCommand, S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";
import DB from "./db";
import { randomUUID } from "crypto";

let s3Client: S3 | null = null;
const BUCKET_NAME = process.env.BUCKET_NAME || "limbo-bucket";

function getS3Client(): S3 {
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

export async function getFile(key: string) {
    const client = getS3Client();

    return await client.getObject({ 
        Bucket: BUCKET_NAME, 
        Key: key
    });
}

export async function uploadFile(
    userId: string, 
    fileName: string, 
    filePath: string,
    fileSize: number, 
    body: Readable, 
    contentType: string
) {
    const client = getS3Client();
    const uuid = randomUUID();

    const parallelUploadS3 = new Upload({
        client,
        params: { 
            Bucket: BUCKET_NAME, 
            Key: uuid,
            Body: body,
            ContentType: contentType 
        },
    });

    await parallelUploadS3.done();

    const query = `
        INSERT INTO files (key, user_id, name, size, path, visible)
        VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [uuid, userId, fileName, fileSize, filePath, 1];

    await DB(query, values);
    return { key: uuid, path: filePath };
}

import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function fileExists(key: string): Promise<boolean> {
    const client = getS3Client();

    try {
        const result = await DB(`SELECT path FROM files WHERE key = $1`, [key]);
        if (!result || result.length === 0) return false;

        const filePath = result[0].path;

        await client.send(new HeadObjectCommand({ 
            Bucket: BUCKET_NAME, 
            Key: filePath 
        }));
        
        return true;
    } catch (error: any) {
        return false;
    }
}

export async function renameFile(key: string, newFileName: string) {
    const query = `UPDATE files SET name = $1 WHERE key = $2`;
    await DB(query, [newFileName, key]);
}

export async function deleteFile(key: string) {
    const client = getS3Client();

    const findQuery = `SELECT path FROM files WHERE key = $1`;
    const result = await DB(findQuery, [key]);

    if (!result || result.length === 0) {
        return { success: false, message: "File not found in database" };
    }

    const filePath = result[0].path;

    await client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filePath
    }));

    const deleteQuery = `DELETE FROM files WHERE key = $1`;
    await DB(deleteQuery, [key]);
}

export async function getKeyByPathAndName(filePath: string, fileName: string): Promise<any> {
    const query = `SELECT key FROM files WHERE path = $1 AND name = $2 LIMIT 1`;
    
    const result = await DB(query, [filePath, fileName]);

    if (result && result.length > 0) {
        return result[0].key;
    }
}

export async function getDownloadUrl(key: string, seconds: number = 900) {
    const client = getS3Client();

    const result = await DB(
        `SELECT name FROM files WHERE key = $1`, 
        [key]
    );

    if (!result || result.length === 0) return null;

    const { name } = result[0];

    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(name)}"`
    });

    try {
        const url = await getSignedUrl(client, command, { expiresIn: seconds });
        return url;
    } catch (error) {
        console.error("Błąd podczas generowania Signed URL:", error);
        return null;
    }
}