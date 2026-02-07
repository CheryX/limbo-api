// GET /file/:dir - Download a file
// POST /file/:dir - Upload a file to directory
// DELETE /file/:file - Delete a file
// PUT /file/:file?new_name= - Rename a file

import express, { Router } from 'express';
import { getFile, uploadFile } from '../lib/r2';
import query from '../lib/db';
import busboy from 'busboy'

export const router: Router = express.Router()

router.get("/:dir", async (req, res) => {

    const dir = req.params.dir;
    const file = await getFile(dir);

    if (file == -1 || !file.Body) {
        return res.status(404).json({ error: "File not found" });
    }

    const file_name_res = await query(
        "SELECT * FROM files WHERE filepath = ($1)", [dir]);

    if (file_name_res == -1) {
        throw new Error(`Files "${dir} not found on database."`)
    }
    
    res.header('Content-Type', file.ContentType || 'application/octet-stream')
    res.header('Content-Disposition', `attachment; filename="${file_name_res[0].replace(/"/g, '\\"')}"`)
    res.header('ETag', file.ETag)

    res.send(file.Body);

})

router.post("/:dir", async (req, res) => {
    const bb = busboy({ headers: req.headers });
    const dir = req.params.dir;

    bb.on('file', async (name, file, info) => {
        const { filename, mimeType } = info;
        const filePath = `${dir}`;
        let size = 0;

        file.on('data', (chunk) => {
            size += chunk.length;
        });

        const key = crypto.randomUUID()

        try {
            await uploadFile(key, file, mimeType);

            await query(
                "INSERT INTO files (key, filename, filepath, size) VALUES ($1, $2, $3, $4)",
                [key, filename, filePath, size]
            );

            res.status(201).json({ message: "Upload successful", path: filePath });
        } catch (err) {
            console.log(err)
            res.status(500).json({ error: "Upload failed" });
        }
    });

    bb.on('error', (err: Error) => {
        res.status(500).json({ error: err.message });
    });

    req.pipe(bb);
});

export default router;