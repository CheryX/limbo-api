// GET /browser/:dir - List contents of directory
// POST /browser/:dir - Create a directory )
// DELETE /browser/:dir - Delete a directory
// PUT /browser/:dir?new_name= - Rename a directory

import express, { Router } from 'express';
import query from '../lib/db';
import { randomUUID } from 'crypto';
import { UsosUser } from '../lib/passport';

export const router: Router = express.Router();

router.get('/:dir', async (req, res) => {
    const dir = req.params.dir;
    const contents = await query("SELECT * FROM files WHERE path = $1;", [dir]);
    res.json(contents);
});

router.post('/:dir', async (req, res) => {
    const dir = req.params.dir;
    const key = randomUUID();
    const userId = (req.user as UsosUser).id;

    await query(
        "INSERT INTO files (key, user_id, name, size, path, visible) VALUES ($1, $2, $3, $4, $5, $6);",
        [key, userId, '.placeholder', 0, dir, 1]
    );

    res.status(201).json({ message: `Created directory: ${dir}`, key });
});

router.delete('/:dir', async (req, res) => {
    const dir = req.params.dir;    
    await query("DELETE FROM files WHERE path = $1 OR path LIKE $2;", [dir, `${dir}/%`]);

    res.json({ message: `Deleted directory: ${dir}` });
});

router.put('/:dir', async (req, res) => {
    const oldPath = req.params.dir;
    const newPath = req.query.new_name as string;

    if (!newPath)
        return res.status(400).json({ error: "Query parameter 'new_name' is required" });

    await query(
        "UPDATE files SET path = regexp_replace(path, $1, $2) WHERE path = $3 OR path LIKE $4;",
        [`^${oldPath}`, newPath, oldPath, `${oldPath}/%`]
    );

    res.json({ message: `Renamed directory: ${oldPath} to ${newPath}` });
});

export default router;