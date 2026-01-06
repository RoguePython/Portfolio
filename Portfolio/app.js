// Hamburger menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navbar = document.querySelector('.navbar');
    
    if (hamburger && navbar) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navbar.classList.toggle('active');
        });

        // Close menu when clicking on a link (mobile)
        document.querySelectorAll('.navbar a').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    hamburger.classList.remove('active');
                    navbar.classList.remove('active');
                }
            });
        });
    }
});

// Smooth scrolling to main components (Home, About me, Work experience etc.)
document.addEventListener('DOMContentLoaded', function() { 
    document.querySelectorAll('.navbar a').forEach(anchor => {
        anchor.addEventListener('click', function (scrollanimation) {
            scrollanimation.preventDefault();

            const targetId = this.getAttribute('href').substring(1); // Get the ID of the target section
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Use smaller offset on mobile to match reduced toolbar height
                const offset = window.innerWidth <= 480 ? 40 : (window.innerWidth <= 768 ? 45 : 50);
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({
                    top: elementPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Dropdown table for showing skills learned at previous work experiences
document.addEventListener("DOMContentLoaded", function() {
    const expandableRows = document.querySelectorAll('.expandable-row');

    expandableRows.forEach(row => {
        row.addEventListener('click', function() {
            const detailsRow = this.nextElementSibling;
            const isVisible = detailsRow.classList.contains('active-row');

            // Toggle the visibility of the details row
            if (isVisible) {
                detailsRow.classList.remove('active-row');
            } else {
                detailsRow.classList.add('active-row');
            }
        });
    });
});
