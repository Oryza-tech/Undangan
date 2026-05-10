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

    /**
     * @param {{ nama: string, presensi: boolean, ucapan: string|null }} payload
     * @returns {Promise<Response|null>}
     */
    const insertAttendance = async (payload) => {
        const config = getConfig();
        if (!config) {
            return Promise.resolve(null);
        }

        const body = {
            nama: payload.nama,
            presensi: payload.presensi ? 1 : 0,
            ucapan: payload.ucapan
        };

        const response = await fetch(`${config.url}/rest/v1/${encodeURIComponent(config.table)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': config.key,
                'Authorization': `Bearer ${config.key}`,
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const details = await response.text();
            throw new Error(`Supabase insert failed (${response.status}): ${details}`);
        }

        return response;
    };

    return {
        insertAttendance,
    };
})();
