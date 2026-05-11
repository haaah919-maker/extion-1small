window.UtoonBulkDownload = async (imageUrls, filename, type) => {
    console.log("Bulk download started:", filename, type);

    if (type === 'pdf') {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        for (let i = 0; i < imageUrls.length; i++) {
            try {
                const r = await fetch(imageUrls[i]);
                const b = await r.blob();
                const data = await new Promise(res => {
                    const reader = new FileReader();
                    reader.onload = () => res(reader.result);
                    reader.readAsDataURL(b);
                });
                if (i > 0) pdf.addPage();
                const pW = pdf.internal.pageSize.getWidth();
                const pH = pdf.internal.pageSize.getHeight();
                const imgProps = pdf.getImageProperties(data);
                const ratio = imgProps.width / imgProps.height;
                let finalW = pW, finalH = pW / ratio;
                if (finalH > pH) { finalH = pH; finalW = pH * ratio; }
                pdf.addImage(data, 'JPEG', (pW-finalW)/2, (pH-finalH)/2, finalW, finalH);
            } catch (e) {}
        }
        pdf.save(`${filename}.pdf`);
    } else {
        const zip = new JSZip();
        for (let i = 0; i < imageUrls.length; i++) {
            try {
                const r = await fetch(imageUrls[i]);
                const b = await r.blob();
                zip.file(`image_${(i+1).toString().padStart(3,'0')}.jpg`, b);
            } catch (e) {}
        }
        const content = await zip.generateAsync({type:"blob"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = `${filename}.zip`;
        a.click();
    }
};
