// GET /browser/:dir - List contents of directory
// POST /browser/:dir - Create a directory )
// DELETE /browser/:dir - Delete a directory
// PUT /browser/:dir?new_name= - Rename a directory

import express, { Router } from 'express'
import query from '../lib/db';
export const router: Router = express.Router()

router.get('/:dir', async (req, res) => {
    const dir = req.params.dir;
    const contents = await query("SELECT * FROM files WHERE filepath LIKE $1;", [`${dir}/%`]);

    res.json( contents );
});

// Assume that an empty directory contains a placeholder file named '.placeholder'
router.post('/:dir', async (req, res) => {
    const dir = req.params.dir;
    await query("INSERT INTO files (filepath) VALUES ($1);", [`${dir}/.placeholder`]);

    res.json({ message: `Created directory: ${dir}` });
});

router.delete('/:dir', async (req, res) => {
    const dir = req.params.dir;
    await query("DELETE FROM files WHERE filepath LIKE $1;", [`${dir}/%`]);

    res.json({ message: `Deleted directory: ${dir}` });
});

router.put('/:dir', async (req, res) => {
    const dir = req.params.dir;
    const newName = String(req.query.new_name);

    await query("UPDATE files SET filepath = REPLACE(filepath, $1, $2) WHERE filepath LIKE $3;", [dir, newName, `${dir}/%`]);

    res.json({ message: `Renamed directory: ${dir} to ${newName}` });
});

export default router;