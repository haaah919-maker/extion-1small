document.addEventListener('DOMContentLoaded', async () => {
    const { userId } = await chrome.storage.local.get("userId");
    if (userId) document.getElementById('user-id').innerText = userId;

    async function refresh() {
        if (!userId) return;
        const btn = document.getElementById('refresh-btn');
        const originalBtnText = btn.innerHTML;
        btn.innerHTML = "<span>🔄</span> Syncing...";

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
                else if (profile.vip_until > now) plan = "VIP";

                const badge = document.getElementById('plan-badge');
                badge.innerText = `${plan} PLAN`;

                if (plan === "FREE") {
                    badge.style.borderColor = "#a855f7";
                    badge.style.color = "#a855f7";
                    document.getElementById('usage-section').style.display = 'block';
                    document.getElementById('vip-section').style.display = 'none';

                    const lastDaily = profile.last_daily || 0;
                    const isSameDay = new Date(lastDaily * 1000).toDateString() === new Date().toDateString();
                    document.getElementById('daily-text').innerText = isSameDay ? "1 / 1" : "0 / 1";
                    document.getElementById('usage-progress').style.width = isSameDay ? "100%" : "0%";
                } else {
                    badge.style.borderColor = "#fbbf24";
                    badge.style.color = "#fbbf24";
                    document.getElementById('usage-section').style.display = 'none';
                    document.getElementById('vip-section').style.display = 'block';

                    document.getElementById('vip-label').innerText = plan === "LIFETIME" ? "Lifetime Premium Active" : "VIP Premium Active";
                    document.getElementById('vip-date').innerText = plan === "LIFETIME" ? "Validity: Infinite" : `Valid Until: ${new Date(profile.vip_until * 1000).toLocaleDateString()}`;
                }
            }
        } catch (e) { console.error(e); }
        btn.innerHTML = originalBtnText;
    }

    document.getElementById('refresh-btn').onclick = refresh;
    document.getElementById('copy-id').onclick = () => {
        navigator.clipboard.writeText(userId);
        const originalBtn = document.getElementById('copy-id').innerHTML;
        document.getElementById('copy-id').innerHTML = "<span>✅</span> Done!";
        setTimeout(() => document.getElementById('copy-id').innerHTML = originalBtn, 2000);
    };

    refresh();
});
