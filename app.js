// Typing animation function
function typeWriter(element, words, typingSpeed = 100, deletingSpeed = 50, pauseTime = 2000) {
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
        const current = words[wordIndex];
        
        if (isDeleting) {
            // Delete characters (backspace)
            element.textContent = current.substring(0, charIndex - 1);
            charIndex--;
            
            if (charIndex === 0) {
                // Finished deleting, move to next word
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                setTimeout(type, 500); // Pause before typing next word
                return;
            }
            
            setTimeout(type, deletingSpeed);
        } else {
            // Type characters
            element.textContent = current.substring(0, charIndex + 1);
            charIndex++;
            
            if (charIndex === current.length) {
                // Finished typing, wait then start deleting
                isDeleting = true;
                setTimeout(type, pauseTime);
                return;
            }
            
            setTimeout(type, typingSpeed);
        }
    }
    
    // Start typing
    type();
}

// Preload hero/portfolio background image and add .bg-loaded when ready (smooth fade-in)
function initBackgroundPreload() {
    var img = new Image();
    img.onload = function() {
        document.querySelector('.home')?.classList.add('bg-loaded');
        document.querySelector('.Portfolio')?.classList.add('bg-loaded');
    };
    img.src = 'assets/images/html1.png';
}

// Consolidated DOMContentLoaded - All initialization in one place
document.addEventListener('DOMContentLoaded', function() {
    initBackgroundPreload();
    // Initialize typing animation
    const typingElement = document.querySelector('.typing-text');
    if (typingElement) {
        const words = ['Web Developer', 'Software Developer', 'Game Developer', 'Superhero', 'Gamer'];
        typeWriter(typingElement, words, 100, 50, 2000);
    }
    // Hamburger menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navbar = document.querySelector('.navbar');
    
    if (hamburger && navbar) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navbar.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', hamburger.classList.contains('active'));
        });

        // Close menu when clicking outside (mobile)
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 768 && 
                navbar.classList.contains('active') &&
                !navbar.contains(event.target) &&
                !hamburger.contains(event.target)) {
                hamburger.classList.remove('active');
                navbar.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Smooth scrolling to main components
    document.querySelectorAll('.navbar a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Close mobile menu if open
                if (window.innerWidth <= 768 && hamburger && navbar) {
                    hamburger.classList.remove('active');
                    navbar.classList.remove('active');
                    hamburger.setAttribute('aria-expanded', 'false');
                }

                // Calculate offset based on screen size
                const offset = window.innerWidth <= 480 ? 40 : (window.innerWidth <= 768 ? 45 : 50);
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({
                    top: elementPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Dropdown table for work experience
    const expandableRows = document.querySelectorAll('.expandable-row');
    expandableRows.forEach(row => {
        row.addEventListener('click', function() {
            const detailsRow = this.nextElementSibling;
            const isVisible = detailsRow.classList.contains('active-row');

            if (isVisible) {
                detailsRow.classList.remove('active-row');
                this.setAttribute('aria-expanded', 'false');
            } else {
                detailsRow.classList.add('active-row');
                this.setAttribute('aria-expanded', 'true');
            }
        });

        // Add ARIA attributes for accessibility
        row.setAttribute('role', 'button');
        row.setAttribute('aria-expanded', 'false');
        row.setAttribute('tabindex', '0');

        // Keyboard support
        row.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                row.click();
            }
        });
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Unobserve after animation to improve performance
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for scroll animations
    const animatedElements = document.querySelectorAll('.left_block, .right_block, .project-container, .Work_Experience, .Get_In_Touch');
    animatedElements.forEach((el, index) => {
        // Add animation class based on element position
        if (el.classList.contains('left_block')) {
            el.classList.add('slide-in-left');
        } else if (el.classList.contains('right_block')) {
            el.classList.add('slide-in-right');
        } else {
            el.classList.add('fade-in');
        }
        observer.observe(el);
    });

    // Add scroll-triggered toolbar background
    let lastScroll = 0;
    const toolbar = document.querySelector('.toolbar');
    if (toolbar) {
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 100) {
                toolbar.style.backgroundColor = 'rgba(0, 0, 0, 0.98)';
                toolbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
            } else {
                toolbar.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
                toolbar.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
            }
            lastScroll = currentScroll;
        });
    }
});
