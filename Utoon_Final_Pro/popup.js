document.addEventListener('DOMContentLoaded', async () => {
    const { userId } = await chrome.storage.local.get("userId");
    if (userId) document.getElementById('user-id').innerText = userId;

    async function refresh() {
        if (!userId) return;
        const btn = document.getElementById('refresh-btn');
        btn.innerText = "Syncing...";

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

                let plan = "Free";
                if (profile.vip_until >= LIFETIME_LIMIT) plan = "Lifetime";
                else if (profile.vip_until > now) plan = "VIP";

                document.getElementById('plan-badge').innerText = plan;
                document.getElementById('plan-badge').style.borderColor = (plan === "Free") ? "#7c3aed" : "#f1c40f";
                document.getElementById('plan-badge').style.color = (plan === "Free") ? "#fff" : "#f1c40f";

                if (plan !== "Free") {
                    document.getElementById('vip-section').style.display = 'block';
                    document.getElementById('usage-section').style.display = 'none';
                    document.getElementById('vip-label').innerText = plan === "Lifetime" ? "Lifetime Plan:" : "VIP Until:";
                    document.getElementById('vip-date').innerText = plan === "Lifetime" ? "Infinity" : new Date(profile.vip_until * 1000).toLocaleDateString();
                } else {
                    document.getElementById('vip-section').style.display = 'none';
                    document.getElementById('usage-section').style.display = 'block';

                    const lastDaily = profile.last_daily || 0;
                    const isSameDay = new Date(lastDaily * 1000).toDateString() === new Date().toDateString();
                    document.getElementById('daily-text').innerText = isSameDay ? "1/1" : "0/1";
                    document.getElementById('usage-progress').style.width = isSameDay ? "100%" : "0%";
                    document.getElementById('usage-progress').style.background = isSameDay ? "#ef4444" : "#7c3aed";
                }
            }
        } catch (e) {
            console.error(e);
        }
        btn.innerText = "Refresh Status";
    }

    document.getElementById('refresh-btn').onclick = refresh;
    document.getElementById('copy-id').onclick = () => {
        navigator.clipboard.writeText(userId);
        const originalText = document.getElementById('copy-id').innerText;
        document.getElementById('copy-id').innerText = "Copied!";
        setTimeout(() => document.getElementById('copy-id').innerText = originalText, 2000);
    };

    refresh();
});
