const embedMapLinks = {
    T1: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241488.11180738496!2d72.56469623281248!3d18.964486200000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7ce3664a78525%3A0x432a3c0c32d32a2e!2sTejyash%20Cyber%20Solutions!5e0!3m2!1sen!2sin!4v1749550030196!5m2!1sen!2sin",
    T2: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241488.11180738496!2d72.56469623281248!3d18.964486200000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c97e07851f9b%3A0x631ad63e1e15b2d8!2sTejyash%20Cyber%20Solutions%20(Santacruz%20-%20Branch)!5e0!3m2!1sen!2sin!4v1749550226892!5m2!1sen!2sin",
    T3: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241488.11180738496!2d72.56469623281248!3d18.964486200000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7cfb4f32637cb%3A0xbb3fc470c9d95a98!2sTejyash%20Cyber%20Solutions%20(Ghodapdeo%20-%20Branch)!5e0!3m2!1sen!2sin!4v1749550317520!5m2!1sen!2sin",
    T4: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241488.11180738496!2d72.56469623281248!3d18.964486200000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c9c2e1c3c9ed%3A0xec85ef38c9f87b6f!2sTejyash%20Cyber%20Solutions%20(Andheri%20-%20Branch)!5e0!3m2!1sen!2sin!4v1749550356329!5m2!1sen!2sin"
};

const shareLinks = {
    T1: "https://www.google.com/maps/place/Tejyash+Cyber+Solutions/@18.9644862,72.8448476,784m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3be7ce3664a78525:0x432a3c0c32d32a2e!8m2!3d18.9644862!4d72.8448476!16s%2Fg%2F11dxbxrjzx?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D",
    T2: "https://www.google.com/maps/place/Tejyash+Cyber+Solutions+(Santacruz+-+Branch)/@19.0842273,72.8498342,784m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3be7c97e07851f9b:0x631ad63e1e15b2d8!8m2!3d19.0842273!4d72.8498342!16s%2Fg%2F11j8vmr1v8?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D",
    T3: "https://www.google.com/maps/place/Tejyash+Cyber+Solutions+(Ghodapdeo+-+Branch)/@18.9820687,72.8411969,784m/data=!3m1!1e3!4m6!3m5!1s0x3be7cfb4f32637cb:0xbb3fc470c9d95a98!8m2!3d18.9820687!4d72.8411969!16s%2Fg%2F11sfdkmlkv?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D",
    T4: "https://www.google.com/maps/place/Tejyash+Cyber+Solutions+(Andheri+-+Branch)/@19.1197454,72.8623308,783m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3be7c9c2e1c3c9ed:0xec85ef38c9f87b6f!8m2!3d19.1197403!4d72.8649057!16s%2Fg%2F11fsvrhjp8?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D"
};

let currentLocation = "T1";

function setMapLocation(locationId) {
    currentLocation = locationId;
    document.getElementById("mapFrame").src = embedMapLinks[locationId];
    // Removed the toggleDropdown() call to keep dropdown open
}

function toggleDropdown() {
    const list = document.getElementById("locationList");
    const icon = document.getElementById("dropdownIcon");
    list.classList.toggle("hidden");
    icon.classList.toggle("rotate-180");
}

async function shareMap() {
    const shareUrl = shareLinks[currentLocation];

    try {
        if (navigator.share) {
            await navigator.share({
                title: 'Tejyash Cyber Solutions Location',
                text: 'Check out this Tejyash Cyber Solutions branch',
                url: shareUrl
            });
        } else {
            await navigator.clipboard.writeText(shareUrl);
            showPopup();
        }
    } catch (err) {
        console.error('Sharing failed:', err);
        try {
            await navigator.clipboard.writeText(shareUrl);
            showPopup();
        } catch (clipboardErr) {
            console.error('Clipboard copy failed:', clipboardErr);
            alert('Failed to share or copy link. Please try manually.');
        }
    }
}

function showPopup() {
    const popup = document.getElementById("copyPopup");
    popup.classList.remove("hidden");
    setTimeout(() => popup.classList.add("hidden"), 2000);
}