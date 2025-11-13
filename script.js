// GeForce NOW launcher
document.addEventListener('DOMContentLoaded', function() {
    const openBtn = document.getElementById('openBtn');
    const loadingScreen = document.querySelector('.loading-screen');
    
    // Function to open blank popup and redirect to GeForce NOW
    function openBlankPopup() {
        const popup = window.open("about:blank", "GFNpopup", "width=1280,height=720");

        if (!popup) {
            alert("Please allow popups for this site!");
            return;
        }

        popup.document.write("<h1>Loading GeForce NOW...</h1>");
        popup.document.title = "Launching...";

        // redirect after 1 second
        setTimeout(() => {
            popup.location.href = "https://play.geforcenow.com/mall/#/layout/games?game-id=fortnite";
        }, 1000);
    }
    
    // Try to open immediately
    openBlankPopup();
    
    // Add a spinner
    if (loadingScreen) {
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        loadingScreen.insertBefore(spinner, loadingScreen.querySelector('p').nextSibling);
    }
    
    // Add button click handler
    if (openBtn) {
        openBtn.addEventListener('click', openBlankPopup);
    }
});
