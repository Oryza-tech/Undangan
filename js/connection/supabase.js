export const supabase = (() => {
    const getConfig = () => {
        const url = window.SUPABASE_URL;
        const key = window.SUPABASE_ANON_KEY;
        const table = window.SUPABASE_TABLE || 'attendance';

        if (!url || !key) {
            return null;
        }

        return {
            url: url.replace(/\/$/, ''),
            key,
            table,
        };
    };

    const getHeaders = () => {
        const config = getConfig();
        if (!config) {
            return null;
        }

        return {
            'Content-Type': 'application/json',
            apikey: config.key,
            Authorization: `Bearer ${config.key}`,
        };
    };

    const mapRow = (row) => {
        return {
            uuid: row.id ? String(row.id) : row.uuid ?? '',
            own: row.id ? String(row.id) : row.uuid ?? '',
            name: row.nama ?? row.name ?? '',
            presence: row.presensi === 1 || row.presensi === true || row.presensi === '1',
            comment: row.comment ?? row.ucapan ?? row.doa ?? null,
            created_at: row.created_at ?? row.inserted_at ?? new Date().toISOString(),
            is_admin: false,
            is_parent: row.parent_id == null,
            gif_url: row.gif_url ?? null,
            ip: row.ip ?? null,
            user_agent: row.user_agent ?? null,
            comments: [],
            like_count: row.like_count ?? 0,
            parent_id: row.parent_id ?? null,
        };
    };

    const buildTree = (rows, per, offset) => {
        const map = new Map();

        rows.forEach((row) => {
            const id = String(row.id ?? row.uuid ?? '');
            map.set(id, {
                row,
                children: [],
            });
        });

        rows.forEach((row) => {
            if (row.parent_id != null) {
                const parentId = String(row.parent_id);
                const entry = map.get(parentId);
                if (entry) {
                    entry.children.push(String(row.id ?? row.uuid ?? ''));
                }
            }
        });

        const createTree = (entry) => {
            const comment = mapRow(entry.row);
            comment.comments = entry.children
                .map((id) => map.get(id))
                .filter(Boolean)
                .map((child) => createTree(child));
            return comment;
        };

        const topRows = rows.filter((row) => row.parent_id == null);
        const paged = topRows.slice(offset, offset + per);
        const lists = paged
            .map((row) => map.get(String(row.id ?? row.uuid ?? '')))
            .filter(Boolean)
            .map(createTree);

        return {
            count: topRows.length,
            lists,
        };
    };

    const getComments = async (per = 10, offset = 0) => {
        const config = getConfig();
        const headers = getHeaders();

        if (!config || !headers) {
            return {
                count: 0,
                lists: [],
            };
        }

        const response = await fetch(`${config.url}/rest/v1/${encodeURIComponent(config.table)}?select=*&order=created_at.desc`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const details = await response.text();
            throw new Error(`Supabase get comments failed (${response.status}): ${details}`);
        }

        const rows = await response.json();
        return buildTree(rows, per, offset);
    };

    const insertComment = async (payload) => {
        const config = getConfig();
        const headers = getHeaders();

        if (!config || !headers) {
            return null;
        }

        const body = {
            nama: payload.name,
            presensi: payload.presence ? 1 : 0,
            comment: payload.comment,
            ucapan: payload.comment,
            doa: payload.comment,
            gif_id: payload.gif_id ?? null,
            parent_id: payload.parent_id ?? null,
        };

        const response = await fetch(`${config.url}/rest/v1/${encodeURIComponent(config.table)}`, {
            method: 'POST',
            headers: {
                ...headers,
                Prefer: 'return=representation',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const details = await response.text();
            throw new Error(`Supabase insert comment failed (${response.status}): ${details}`);
        }

        const data = await response.json();
        return mapRow(data[0]);
    };

    const updateComment = async (id, presence, comment, gif_id) => {
        const config = getConfig();
        const headers = getHeaders();

        if (!config || !headers) {
            return null;
        }

        const body = {
            presensi: presence === null ? undefined : (presence ? 1 : 0),
            comment: comment ?? undefined,
            ucapan: comment ?? undefined,
            doa: comment ?? undefined,
            gif_id: gif_id ?? undefined,
        };

        const response = await fetch(`${config.url}/rest/v1/${encodeURIComponent(config.table)}?id=eq.${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: {
                ...headers,
                Prefer: 'return=representation',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const details = await response.text();
            throw new Error(`Supabase update comment failed (${response.status}): ${details}`);
        }

        const data = await response.json();
        return mapRow(data[0]);
    };

    const deleteComment = async (id) => {
        const config = getConfig();
        const headers = getHeaders();

        if (!config || !headers) {
            return false;
        }

        const response = await fetch(`${config.url}/rest/v1/${encodeURIComponent(config.table)}?id=eq.${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers,
        });

        if (!response.ok) {
            const details = await response.text();
            throw new Error(`Supabase delete comment failed (${response.status}): ${details}`);
        }

        return true;
    };

    return {
        getComments,
        insertComment,
        updateComment,
        deleteComment,
    };
})();
