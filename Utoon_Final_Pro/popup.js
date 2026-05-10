document.addEventListener('DOMContentLoaded', async () => {
    const { userId } = await chrome.storage.local.get("userId");
    if (userId) document.getElementById('user-id').innerText = userId;

    async function sync() {
        if (!userId) return;
        const btn = document.getElementById('refresh-btn');
        btn.innerText = "SYNCING...";
        btn.disabled = true;

        try {
            const response = await fetch(`https://hqzwcuhiucqyyzjxpjlk.supabase.co/rest/v1/users?user_id=eq.${userId}`, {
                headers: {
                    "apikey": "sb_publishable_2Wi12-h6cvDR-0cYYQeW2w_RbbkIx0Q",
                    "Authorization": "Bearer sb_publishable_2Wi12-h6cvDR-0cYYQeW2w_RbbkIx0Q"
                }
            });
            const data = await response.json();
            const profile = data[0];

            if (profile) {
                const now = Math.floor(Date.now() / 1000);
                const LIFETIME_LIMIT = 4102444800;

                let plan = "FREE";
                if (profile.vip_until >= LIFETIME_LIMIT) plan = "LIFETIME";
                else if (profile.vip_until > now) plan = "ELITE VIP";

                const badge = document.getElementById('plan-badge');
                badge.innerText = plan;
                badge.style.borderColor = (plan === "FREE") ? "#00d2ff" : "#f1c40f";
                badge.style.color = (plan === "FREE") ? "#00d2ff" : "#f1c40f";

                if (plan !== "FREE") {
                    document.getElementById('vip-section').style.display = 'block';
                    document.getElementById('usage-section').style.display = 'none';
                    document.getElementById('vip-label').innerText = plan === "LIFETIME" ? "ACCESS TYPE:" : "EXPIRES:";
                    document.getElementById('vip-date').innerText = plan === "LIFETIME" ? "PERMANENT" : new Date(profile.vip_until * 1000).toLocaleDateString();
                } else {
                    document.getElementById('vip-section').style.display = 'none';
                    document.getElementById('usage-section').style.display = 'block';

                    const lastDaily = profile.last_daily || 0;
                    const isSameDay = new Date(lastDaily * 1000).toDateString() === new Date().toDateString();
                    document.getElementById('daily-text').innerText = isSameDay ? "1 / 1" : "0 / 1";
                    document.getElementById('usage-progress').style.width = isSameDay ? "100%" : "0%";
                    document.getElementById('usage-progress').style.background = isSameDay ? "linear-gradient(to right, #f83600, #fe8c00)" : "linear-gradient(to right, #00d2ff, #3a7bd5)";
                }
            }
        } catch (e) {
            console.error(e);
        }
        btn.innerText = "SYNC STATUS";
        btn.disabled = false;
    }

    document.getElementById('refresh-btn').onclick = sync;
    document.getElementById('copy-id').onclick = () => {
        navigator.clipboard.writeText(userId);
        const originalText = document.getElementById('copy-id').innerText;
        document.getElementById('copy-id').innerText = "COPIED!";
        setTimeout(() => document.getElementById('copy-id').innerText = originalText, 2000);
    };

    sync();
});
