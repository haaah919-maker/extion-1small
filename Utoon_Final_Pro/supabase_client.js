const SUPABASE_URL = "https://hqzwcuhiucqyyzjxpjlk.supabase.co";
const SUPABASE_KEY = "sb_publishable_2Wi12-h6cvDR-0cYYQeW2w_RbbkIx0Q";

async function supabaseQuery(table, method, body = null, queryParams = "") {
    const url = `${SUPABASE_URL}/rest/v1/${table}${queryParams}`;
    const headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    return await response.json();
}

async function getUserProfile(userId) {
    const data = await supabaseQuery("users", "GET", null, `?user_id=eq.${userId}`);
    return data[0] || null;
}

async function createUserProfile(userId, username) {
    const body = {
        user_id: userId,
        username: username,
        balance: 1000,
        vip_until: 0,
        created_at: Math.floor(Date.now() / 1000)
    };
    const data = await supabaseQuery("users", "POST", body);
    return data[0];
}

async function updateUsage(userId) {
    const profile = await getUserProfile(userId);
    if (!profile) return { allowed: true, plan: "Guest" };

    const now = Math.floor(Date.now() / 1000);
    const lastDaily = profile.last_daily || 0;
    const todayStr = new Date().toDateString();
    const lastDailyStr = new Date(lastDaily * 1000).toDateString();
    const isSameDay = todayStr === lastDailyStr;

    // Lifetime (vip_until set to a very far future like 9999-12-31)
    const LIFETIME_LIMIT = 4102444800; // 2100-01-01
    if (profile.vip_until >= LIFETIME_LIMIT) {
        return { allowed: true, plan: "Lifetime" };
    }

    if (profile.vip_until > now) {
        return { allowed: true, plan: "VIP" };
    }

    // Free users: 1 chapter per day
    if (isSameDay) {
        return { allowed: false, plan: "Free", reason: "Limit Reached" };
    }

    await supabaseQuery("users", "PATCH", { last_daily: now }, `?user_id=eq.${userId}`);
    return { allowed: true, plan: "Free" };
}

export { getUserProfile, createUserProfile, updateUsage };
