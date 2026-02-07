// GET /file/:path/:filename - Get download link
// POST /file/:path - Upload a file to directory
// DELETE /file/:path/:filename - Delete a file
// PUT /file/:path/:filename?new_name= - Rename a file

import express, { Router } from 'express';
import { deleteFile, getDownloadUrl, getKeyByPathAndName, renameFile, uploadFile } from '../lib/r2';
import busboy from 'busboy'
import { UsosUser } from '../lib/passport';

export const router: Router = express.Router()

router.get("/:path/:filename", async (req, res) => {
    try {
        const { path, filename } = req.params;
        
        const uuid = await getKeyByPathAndName(path, filename);

        if (!uuid)
            return res.status(404).json({ error: "File not found in database" });

        const downloadUrl = await getDownloadUrl(uuid);

        if (!downloadUrl)
            return res.status(404).json({ error: "File not found in storage" });

        res.redirect(downloadUrl);
    } catch (err) {
        res.status(500).json({ error: "Error retrieving file" });
    }
});

router.post("/:path", async (req, res) => {
    const bb = busboy({ headers: req.headers });
    const filePath = req.params.path;
    const userId = (req.user as UsosUser).id;

    let size = 0;
    bb.on('data', (chunk) => {
        size += chunk.length;
    });

    bb.on('file', async (name, fileStream, info) => {
        const { filename, mimeType } = info;
        
        try {
            const result = await uploadFile(
                userId, filename, filePath, size,
                fileStream, mimeType
            );

            res.status(201).json({ 
                message: "Upload successful", 
                key: result.key,
                path: result.path 
            });
        } catch (err) {
            console.error(err);
            if (!res.headersSent) res.status(500).json({ error: "Upload failed" });
        }
    });

    req.pipe(bb);
});

router.delete("/:path/:filename", async (req, res) => {
    try {
        const { path, filename } = req.params;
        const uuid = await getKeyByPathAndName(path, filename);

        if (!uuid) {
            return res.status(404).json({ error: "File not found" });
        }

        await deleteFile(uuid);
        res.json({ message: "File deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

router.put("/:path/:filename", async (req, res) => {
    try {
        const { path, filename } = req.params;
        const newName = req.query.new_name as string;

        if (!newName) {
            return res.status(400).json({ error: "Missing new_name parameter" });
        }

        const uuid = await getKeyByPathAndName(path, filename);

        if (!uuid) {
            return res.status(404).json({ error: "File not found" });
        }

        await renameFile(uuid, newName);
        
        res.json({ message: "File renamed successfully" });
    } catch (err) {
        res.status(500).json({ error: "Rename failed" });
    }
});

export default router;