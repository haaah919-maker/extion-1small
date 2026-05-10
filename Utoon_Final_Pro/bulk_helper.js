window.UtoonBulkDownload = async (imageUrls, filename, type) => {
    console.log("Ultimate Bulk Downloader Started:", filename, type);
    const msg = document.getElementById('loader-msg');

    const updateMsg = (text) => {
        if (msg) {
            msg.innerText = text;
            msg.style.display = 'block';
        }
    };

    try {
        const validImages = [];
        const total = imageUrls.length;

        for (let i = 0; i < total; i++) {
            updateMsg(`[${i+1}/${total}] Fetching Image...`);
            try {
                const r = await fetch(imageUrls[i]);
                if (!r.ok) continue;
                const b = await r.blob();
                if (b.size < 1000) continue; // Skip placeholders
                validImages.push(b);
            } catch (e) {
                console.warn("Failed to fetch image:", imageUrls[i]);
            }
        }

        if (validImages.length === 0) {
            updateMsg("ERROR: No valid images found.");
            setTimeout(() => { if(msg) msg.style.display = 'none'; }, 3000);
            return;
        }

        if (type === 'pdf') {
            updateMsg("Building PDF (Legendary Mode)...");
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();

            for (let i = 0; i < validImages.length; i++) {
                updateMsg(`Processing PDF: ${i+1}/${validImages.length}`);
                const data = await new Promise(res => {
                    const reader = new FileReader();
                    reader.onload = () => res(reader.result);
                    reader.readAsDataURL(validImages[i]);
                });

                if (i > 0) pdf.addPage();
                const pW = pdf.internal.pageSize.getWidth();
                const pH = pdf.internal.pageSize.getHeight();
                const imgProps = pdf.getImageProperties(data);
                const ratio = imgProps.width / imgProps.height;
                let finalW = pW, finalH = pW / ratio;
                if (finalH > pH) { finalH = pH; finalW = pH * ratio; }
                pdf.addImage(data, 'JPEG', (pW-finalW)/2, (pH-finalH)/2, finalW, finalH);
            }
            updateMsg("Finalizing PDF...");
            pdf.save(`${filename}.pdf`);
        } else {
            updateMsg("Compiling ZIP Archive...");
            const zip = new JSZip();
            validImages.forEach((blob, i) => {
                zip.file(`image_${(i+1).toString().padStart(3,'0')}.jpg`, blob);
            });
            const content = await zip.generateAsync({type:"blob"});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = `${filename}.zip`;
            a.click();
        }

        updateMsg("SUCCESS: Download Complete!");
        setTimeout(() => { if(msg) msg.style.display = 'none'; }, 4000);

    } catch (err) {
        console.error("Bulk Download Error:", err);
        updateMsg("CRITICAL ERROR: Failed to generate file.");
        setTimeout(() => { if(msg) msg.style.display = 'none'; }, 5000);
    }
};
