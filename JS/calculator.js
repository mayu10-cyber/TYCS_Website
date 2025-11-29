document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("costSidebar");
    const openBtn = document.getElementById("costEstimatorBtn");
    const closeBtn = document.getElementById("closeSidebar");
    const nextBtns = document.querySelectorAll('.next-btn');
    const backBtns = document.querySelectorAll('.back-btn');
    const newEstimateBtn = document.querySelector('.new-estimate-btn');
    const steps = document.querySelectorAll('.step');
    const stepContents = document.querySelectorAll('.step-content');

    let currentStep = 1;
    let selectedServices = [];
    let selectedOptions = [];

    // Toggle sidebar
    openBtn.addEventListener("click", () => {
        sidebar.classList.add('open');
        document.body.style.overflow = 'hidden';
        resetCalculator();
    });

    closeBtn.addEventListener("click", () => {
        sidebar.classList.remove('open');
        document.body.style.overflow = '';
        resetCalculator();
    });

    // Initialize service options
    initializeServiceOptions();

    // Next button
    nextBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            if (currentStep === 1) {
                if (selectedServices.length === 0) {
                    alert('Please select at least one service');
                    return;
                }
                updateServiceOptions();
            }

            if (currentStep === 2) {
                if (selectedOptions.length === 0) {
                    alert('Please select at least one option');
                    return;
                }
                calculateCost();
            }

            // Proceed to next step
            const nextStep = currentStep + 1;
            if (nextStep <= 3) {
                goToStep(nextStep);
            }
        });
    });

    // Back button
    backBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            goToStep(currentStep - 1);
        });
    });

    // New estimate
    newEstimateBtn?.addEventListener('click', resetCalculator);

    function initializeServiceOptions() {
        const serviceOptionsContainer = document.querySelector('#costForm .service-options');

        // Define all services with their icons and labels
        const services = [
            { value: "repair", icon: "🛠", label: "estimator.repair", text: "Repair" },
            { value: "website", icon: "🌐", label: "estimator.website", text: "Website" },
            { value: "cctv", icon: "📹", label: "estimator.cctv", text: "CCTV" },
            { value: "digital", icon: "📢", label: "estimator.digital", text: "Digital Marketing" },
            { value: "sales", icon: "💻", label: "estimator.sales", text: "Computer Sales" },
            { value: "refurbish", icon: "♻️", label: "estimator.refurbish", text: "Refurbish Laptops" },
            { value: "remote", icon: "🖥️", label: "estimator.remote", text: "Remote Support" },
            { value: "virus", icon: "🦠", label: "estimator.virus", text: "Virus Removal" },
            { value: "networking", icon: "📶", label: "estimator.networking", text: "Networking" },
            { value: "consultation", icon: "💡", label: "estimator.consultation", text: "IT Consultation" },
            { value: "data", icon: "💾", label: "estimator.data", text: "Data Recovery" }
        ];

        // Generate HTML for service options
        serviceOptionsContainer.innerHTML = services.map(service => `
            <div class="service-option" data-value="${service.value}">
                <div class="service-icon">${service.icon}</div>
                <span data-i18n="${service.label}">${service.text}</span>
            </div>
        `).join('');

        // Add click event listeners to service options
        document.querySelectorAll('#costForm .service-option').forEach(option => {
            option.addEventListener('click', function () {
                const serviceValue = this.getAttribute('data-value');
                const index = selectedServices.indexOf(serviceValue);
                
                if (index === -1) {
                    // Add to selection
                    selectedServices.push(serviceValue);
                    this.classList.add('selected');
                } else {
                    // Remove from selection
                    selectedServices.splice(index, 1);
                    this.classList.remove('selected');
                }
                
                // Update hidden field (comma-separated)
                document.getElementById('serviceType').value = selectedServices.join(',');
            });
        });
    }

    function updateServiceOptions() {
        const optionsContainer = document.getElementById('serviceOptions');
        optionsContainer.innerHTML = '';
        
        // Create a container for each selected service's options
        selectedServices.forEach(service => {
            if (serviceOptions[service]) {
                const serviceDiv = document.createElement('div');
                serviceDiv.className = 'service-option-group';
                serviceDiv.innerHTML = `
                    <h4 class="service-group-title" data-i18n="${serviceOptions[service].label}">${serviceOptions[service].label}</h4>
                    <div class="service-options">
                        ${serviceOptions[service].options.map(option => `
                            <div class="service-option" data-service="${service}" data-value="${option.value}" ${option.technical ? `title="${option.technical}"` : ''}>
                                <div class="service-icon">${option.icon}</div>
                                <span data-i18n="${option.label}">${option.text}</span>
                                ${option.technical ? '<div class="tech-tooltip">ℹ️</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
                optionsContainer.appendChild(serviceDiv);
            }
        });

        // Add event listeners to new options
        document.querySelectorAll('#serviceOptions .service-option').forEach(option => {
            option.addEventListener('click', function () {
                const service = this.getAttribute('data-service');
                const value = this.getAttribute('data-value');
                const key = `${service}_${value}`;
                
                if (this.classList.contains('selected')) {
                    // Remove from selection
                    this.classList.remove('selected');
                    selectedOptions = selectedOptions.filter(opt => opt !== key);
                } else {
                    // Add to selection
                    this.classList.add('selected');
                    selectedOptions.push(key);
                }
            });
        });
    }

    function calculateCost() {
        let totalCost = 0;

        // Calculate cost for each selected option
        selectedOptions.forEach(optionKey => {
            const [service, option] = optionKey.split('_');
            if (pricing[service] && pricing[service][option]) {
                totalCost += pricing[service][option];
            }
        });

        // Animation code
        const resultElement = document.getElementById("resultCost");
        const duration = 1000;
        const start = 0;
        const increment = totalCost / (duration / 16);

        const animate = () => {
            const current = parseInt(resultElement.textContent);
            if (current < totalCost) {
                resultElement.textContent = Math.min(Math.floor(current + increment), totalCost);
                requestAnimationFrame(animate);
            } else {
                resultElement.textContent = totalCost;
            }
        };

        resultElement.textContent = start;
        animate();
    }

    function goToStep(step) {
        if (step < 1 || step > 3) return;

        // Update steps UI
        steps.forEach(s => {
            const stepNum = parseInt(s.getAttribute('data-step'));
            s.classList.toggle('active', stepNum <= step);
        });

        // Update content visibility
        stepContents.forEach(content => {
            const contentStep = parseInt(content.getAttribute('data-step'));
            content.classList.toggle('hidden', contentStep !== step);
            content.classList.toggle('active', contentStep === step);
        });

        currentStep = step;
    }

    function resetCalculator() {
        currentStep = 1;
        selectedServices = [];
        selectedOptions = [];

        // Reset UI
        document.querySelectorAll('.service-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        document.getElementById('serviceType').value = '';
        document.getElementById('resultCost').textContent = '0';

        goToStep(1);
    }

    // Define options for each service type
    const serviceOptions = {
        repair: {
            label: "estimator.issue",
            options: [
                { value: "screen", icon: "🖥", label: "estimator.screen", text: "Screen" },
                { value: "battery", icon: "🔋", label: "estimator.battery", text: "Battery" },
                { value: "software", icon: "💾", label: "estimator.software", text: "Software" }
            ]
        },
        website: {
            label: "estimator.pages",
            options: [
                { value: "basic", icon: "1-3", label: "estimator.pagesBasic", text: "Basic (1-3)" },
                { value: "medium", icon: "4-6", label: "estimator.pagesMedium", text: "Medium (4-6)" },
                { value: "large", icon: "7+", label: "estimator.pagesLarge", text: "Large (7+)" }
            ]
        },
        cctv: {
            label: "estimator.cameras",
            options: [
                { value: "2", icon: "2", label: "estimator.cameras2", text: "2 Cameras" },
                { value: "4", icon: "4", label: "estimator.cameras4", text: "4 Cameras" },
                { value: "8", icon: "8", label: "estimator.cameras8", text: "8+ Cameras" }
            ]
        },
        digital: {
            label: "estimator.type",
            options: [
                { value: "seo", icon: "🔍", label: "estimator.seo", text: "SEO" },
                { value: "social", icon: "📱", label: "estimator.social", text: "Social Media" },
                { value: "ads", icon: "📢", label: "estimator.ads", text: "Google Ads" }
            ]
        },
        sales: {
            label: "estimator.device",
            options: [
                { value: "laptop", icon: "💻", label: "estimator.laptop", text: "Laptop" },
                { value: "desktop", icon: "🖥️", label: "estimator.desktop", text: "Desktop" },
                { value: "allinone", icon: "🖥️💻", label: "estimator.allinone", text: "All-in-One" }
            ]
        },
        refurbish: {
            label: "estimator.condition",
            options: [
                { value: "gradea", icon: "A+", label: "estimator.gradea", text: "Grade A (Like New)" },
                { value: "gradeb", icon: "B", label: "estimator.gradeb", text: "Grade B (Good)" },
                { value: "gradec", icon: "C", label: "estimator.gradec", text: "Grade C (Fair)" }
            ]
        },
        remote: {
            label: "estimator.issueType",
            options: [
                {
                    value: "os_issue",
                    icon: "💻",
                    label: "estimator.osIssue",
                    text: "OS Corruption",
                    technical: "Boot failures, driver conflicts"
                },
                {
                    value: "network_troubleshoot",
                    icon: "📶",
                    label: "estimator.networkIssue",
                    text: "Network Issues",
                    technical: "WiFi drops, VPN problems"
                },
                {
                    value: "software_crash",
                    icon: "💥",
                    label: "estimator.softwareCrash",
                    text: "App Crashes",
                    technical: "BSODs, memory leaks"
                }
            ]
        },
        virus: {
            label: "estimator.infectionType",
            options: [
                {
                    value: "ransomware",
                    icon: "🔒",
                    label: "estimator.ransomware",
                    text: "Ransomware",
                    technical: "Encrypted files, ransom notes"
                },
                {
                    value: "rootkit",
                    icon: "👁️",
                    label: "estimator.rootkit",
                    text: "Rootkit",
                    technical: "Hidden processes"
                },
                {
                    value: "botnet",
                    icon: "🤖",
                    label: "estimator.botnet",
                    text: "Botnet",
                    technical: "Unusual network traffic"
                }
            ]
        },
        networking: {
            label: "estimator.problemType",
            options: [
                {
                    value: "switch_config",
                    icon: "🔀",
                    label: "estimator.switchIssue",
                    text: "Switch Issues",
                    technical: "VLAN mismatches, STP loops"
                },
                {
                    value: "router_failure",
                    icon: "🔄",
                    label: "estimator.routerIssue",
                    text: "Router Issues",
                    technical: "BGP flaps, NAT problems"
                },
                {
                    value: "cable_testing",
                    icon: "🔌",
                    label: "estimator.cableIssue",
                    text: "Cable Problems",
                    technical: "CRC errors, certification"
                }
            ]
        },
        consultation: {
            label: "estimator.consultType",
            options: [
                { value: "basic", icon: "💡", label: "estimator.basicConsult", text: "Basic" },
                { value: "strategy", icon: "📊", label: "estimator.strategyConsult", text: "Strategy" },
                { value: "ongoing", icon: "🔄", label: "estimator.ongoingConsult", text: "Ongoing" }
            ]
        },
        data: {
            label: "estimator.dataType",
            options: [
                { value: "basic", icon: "💾", label: "estimator.basicRecovery", text: "Basic" },
                { value: "advanced", icon: "🧰", label: "estimator.advancedRecovery", text: "Advanced" },
                { value: "emergency", icon: "🚑", label: "estimator.emergencyRecovery", text: "Emergency" }
            ]
        }
    };

    // Pricing structure for all services
    const pricing = {
        repair: {
            screen: 1500,
            battery: 1200,
            software: 500
        },
        website: {
            basic: 5000,
            medium: 10000,
            large: 15000
        },
        cctv: {
            "2": 5000,
            "4": 10000,
            "8": 20000
        },
        digital: {
            seo: 4000,
            social: 6000,
            ads: 8000
        },
        sales: {
            laptop: 30000,
            desktop: 25000,
            allinone: 35000
        },
        refurbish: {
            gradea: 20000,
            gradeb: 15000,
            gradec: 10000
        },
        remote: {
            os_issue: 2500,
            network_troubleshoot: 1800,
            software_crash: 2200
        },
        virus: {
            ransomware: 3500,
            rootkit: 4000,
            botnet: 3000
        },
        networking: {
            switch_config: 5000,
            router_failure: 6500,
            cable_testing: 2800
        },
        consultation: {
            basic: 2000,
            strategy: 5000,
            ongoing: 10000
        },
        data: {
            basic: 1500,
            advanced: 3000,
            emergency: 5000
        }
    };

    // Add tooltip styles
    const style = document.createElement('style');
    style.textContent = `
        .tech-tooltip {
            display: inline-block;
            margin-left: 8px;
            color: #00ffb8;
            cursor: help;
        }
        .service-option[title]:hover:after {
            content: attr(title);
            position: absolute;
            background: #23283a;
            border: 1px solid #00ffb8;
            padding: 8px;
            border-radius: 4px;
            z-index: 100;
            width: 200px;
            font-size: 14px;
        }
        .service-option-group {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e9ecef;
        }
        .service-option-group:last-child {
            border-bottom: none;
        }
        .service-group-title {
            font-size: 1rem;
            font-weight: 500;
            margin-bottom: 0.8rem;
            color: #333333;
        }
    `;
    document.head.appendChild(style);
});