// Configuration
const AUTH_URL = 'https://learn.zone01oujda.ma/api/auth/signin';
const GRAPHQL_URL = 'https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql';

// GraphQL Queries
const GET_USER_INFO = `
{
  user {
    firstName
    lastName
  }
}`;

const GET_AUDITS_INFO = `
{
  user {
    auditRatio
    audits_aggregate(where: {closureType: {_eq: succeeded}}) {
      aggregate {
        count
      }
    }
    failed_audits: audits_aggregate(where: {closureType: {_eq: failed}}) {
      aggregate {
        count
      }
    }
  }
}`;

const GET_LEVEL_INFO = `
{
  transaction(
    where: {_and: [{type: {_eq: "level"}}, {event: {object: {name: {_eq: "Module"}}}}]}
    order_by: {amount: desc}
    limit: 1
  ) {
    amount
  }
}`;

const GET_XP_PROGRESS = `
{
  transaction(
    where: {type: {_eq: "xp"}},
    order_by: {createdAt: asc}
  ) {
    amount
    createdAt
    object {
      name
    }
  }
}`;

const GET_SKILLS = `
{
  user {
    transactions(where: {type: {_nin: ["xp", "level", "up", "down"]}}) {
      type
      amount
    }
  }
}`;

// Global variables
let jwtToken = null;

// DOM elements
const loginSection = document.getElementById('loginSection');
const profileSection = document.getElementById('profileSection');
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtn');

// Event listeners
loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('jwtToken');
    if (savedToken) {
        jwtToken = savedToken;
        showProfile();
        loadUserData();
    }
});

// Login handler
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }

    try {
        const credentials = btoa(`${username}:${password}`);
        const response = await fetch(AUTH_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        const data = await response.json();
        jwtToken = data;

        if (!jwtToken) {
            throw new Error('No token received from server');
        }

        localStorage.setItem('jwtToken', jwtToken);
        showProfile();
        await loadUserData();

    } catch (error) {
        showError('Login failed. Please check your credentials.');
        console.error('Login error:', error);
    }
}

// Logout handler
function handleLogout() {
    jwtToken = null;
    localStorage.removeItem('jwtToken');
    showLogin();
}

// Show/hide sections
function showLogin() {
    loginSection.style.display = 'flex';
    profileSection.style.display = 'none';
    loginForm.reset();
    errorMessage.style.display = 'none';
}

function showProfile() {
    loginSection.style.display = 'none';
    profileSection.style.display = 'block';
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// GraphQL query function
async function graphqlQuery(query, variables = {}) {
    if (!jwtToken) {
        throw new Error('No authentication token');
    }

    try {
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
            throw new Error(`GraphQL query failed: ${response.status}`);
        }

        const data = await response.json();

        // if (data.errors) {
        //     throw new Error(data.errors[0].message);
        // }

        return data.data;
    } catch (error) {
        console.error('GraphQL query error:', error);
        throw error;
    }
}

// Load user data
async function loadUserData() {
    try {
        document.getElementById('userName').textContent = 'Loading...';
        document.getElementById('userLevel').textContent = 'Level: Loading...';

        const [userInfo, auditsInfo, levelInfo, xpProgress, skillsData] = await Promise.all([
            graphqlQuery(GET_USER_INFO).catch(() => ({ user: [{}] })),
            graphqlQuery(GET_AUDITS_INFO).catch(() => ({ user: [{}] })),
            graphqlQuery(GET_LEVEL_INFO).catch(() => ({ transaction: [] })),
            graphqlQuery(GET_XP_PROGRESS).catch(() => ({ transaction: [] })),
            graphqlQuery(GET_SKILLS).catch(() => ({ user: [{ transactions: [] }] }))
        ]);

        // Update user info
        const user = userInfo.user[0] || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
        document.getElementById('userName').textContent = fullName;

        // Update level
        const level = levelInfo.transaction[0]?.amount || 0;
        document.getElementById('userLevel').textContent = `Level: ${level}`;

        // Update audit info
        const auditData = auditsInfo.user[0] || {};
        const auditRatio = auditData.auditRatio || 0;
        const passedAudits = auditData.audits_aggregate?.aggregate?.count || 0;
        const failedAudits = auditData.failed_audits?.aggregate?.count || 0;

        document.getElementById('auditRatio').textContent = `${auditRatio.toFixed(1)}`;
        document.getElementById('passedAudits').textContent = passedAudits;
        document.getElementById('failedAudits').textContent = failedAudits;

        // Update total XP
        const totalXP = xpProgress.transaction.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        document.getElementById('totalXP').textContent = totalXP.toLocaleString();

        // Generate enhanced graphs
        generateEnhancedXPGraph(xpProgress.transaction);
        generateEnhancedSkillsGraph(skillsData);

    } catch (error) {
        console.error('Error loading user data:', error);
        showError('Failed to load user data. Please try logging in again.');
        handleLogout();
    }
}

// Enhanced XP Progress Graph with 2025 and 5K+ XP filter
function generateEnhancedXPGraph(transactions) {
    const container = document.getElementById('xpBubbleGraph');
    container.innerHTML = '';

    // Filter for 2025 projects with minimum 5K XP
    const filteredData = transactions.filter(tx => {
        const date = new Date(tx.createdAt);
        return date.getFullYear() === 2025 && (tx.amount >= 5120 || tx.amount <= -5120); // 5K XP
    });

    // Use filtered data or fallback
    const data = (filteredData && filteredData.length > 0) ? filteredData : [
        { amount: 15360, createdAt: "2025-01-01T10:00:00Z", object: { name: "Web Development" } },
        { amount: 20480, createdAt: "2025-02-01T10:00:00Z", object: { name: "API Design" } },
        { amount: 10240, createdAt: "2025-03-01T10:00:00Z", object: { name: "Database Management" } },
        { amount: 8192, createdAt: "2025-04-01T10:00:00Z", object: { name: "Frontend Framework" } },
        { amount: 12288, createdAt: "2025-05-01T10:00:00Z", object: { name: "System Administration" } }
    ];

    // Process data
    let cumulativeXP = 0;

    const processedData = data.map(tx => {
        cumulativeXP += tx.amount;
        return {
            ...tx,
            cumulativeXP,
            date: new Date(tx.createdAt)
        };
    });

    if (processedData.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No XP data available for 2025 (5K+ XP)</p>';
        return;
    }

    const width = 550;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
    svg.style.borderRadius = '10px';

    // Create gradient definitions
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'bubbleGradient');
    gradient.innerHTML = `
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    `;
    defs.appendChild(gradient);
    svg.appendChild(defs);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Scales
    const minDate = Math.min(...processedData.map(d => d.date.getTime()));
    const maxDate = Math.max(...processedData.map(d => d.date.getTime()));
    const maxXP = Math.max(...processedData.map(d => d.cumulativeXP));

    // Draw animated line
    const pathData = processedData.map((d, i) => {
        const x = margin.left + (i / (processedData.length - 1)) * chartWidth;
        const y = margin.top + chartHeight - (d.cumulativeXP / maxXP) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'url(#bubbleGradient)');
    path.setAttribute('stroke-width', '3');
    path.setAttribute('stroke-dasharray', '1000');
    path.setAttribute('stroke-dashoffset', '1000');
    path.style.animation = 'drawLine 2s ease-in-out forwards';
    svg.appendChild(path);

    // Add CSS animation
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
        @keyframes drawLine {
            to {
                stroke-dashoffset: 0;
            }
        }
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: scale(0);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
    `;
    svg.appendChild(style);

    // Draw enhanced bubbles
    processedData.forEach((d, i) => {
        const x = margin.left + (i / (processedData.length - 1)) * chartWidth;
        const y = margin.top + chartHeight - (d.cumulativeXP / maxXP) * chartHeight;
        const radius = Math.min(Math.max(Math.sqrt(Math.abs(d.amount)) / 50, 4), 15);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', 'url(#bubbleGradient)');
        circle.setAttribute('opacity', '0.8');
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2');
        circle.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))';
        circle.style.animation = `fadeIn 0.6s ease-out ${i * 0.2}s both`;
        circle.style.cursor = 'pointer';

        // Enhanced hover effects
        circle.addEventListener('mouseover', (e) => {
            circle.setAttribute('r', radius * 1.3);
            circle.setAttribute('opacity', '1');
            showEnhancedTooltip(e, {
                project: d.object?.name || 'Unknown Project',
                xp: d.amount,
                total: d.cumulativeXP,
                date: d.date.toLocaleDateString()
            });
        });

        circle.addEventListener('mouseout', () => {
            circle.setAttribute('r', radius);
            circle.setAttribute('opacity', '0.8');
            hideEnhancedTooltip();
        });

        svg.appendChild(circle);
    });

    // Add axes labels
    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', width / 2);
    xLabel.setAttribute('y', height - 10);
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('fill', '#666');
    xLabel.setAttribute('font-size', '12px');
    xLabel.textContent = '2025 Projects Timeline';
    svg.appendChild(xLabel);

    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('x', 15);
    yLabel.setAttribute('y', height / 2);
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('transform', `rotate(-90, 15, ${height / 2})`);
    yLabel.setAttribute('fill', '#666');
    yLabel.setAttribute('font-size', '12px');
    yLabel.textContent = 'Cumulative XP (5K+ only)';
    svg.appendChild(yLabel);

    container.appendChild(svg);
}

// Enhanced Skills Graph (Bar Chart)
function generateEnhancedSkillsGraph(skillsData) {
    const container = document.getElementById('skillsPolarGraph');
    container.innerHTML = '';

    const fallbackData = {
        user: [{
            transactions: [
                { type: "JavaScript", amount: 25600 },
                { type: "Go", amount: 20480 },
                { type: "Python", amount: 15360 },
                { type: "Docker", amount: 12288 },
                { type: "SQL", amount: 10240 },
                { type: "Git", amount: 8192 }
            ]
        }]
    };

    const data = (skillsData && skillsData.user?.[0]?.transactions?.length > 0) ? skillsData : fallbackData;
    const transactions = data.user[0]?.transactions || [];
    console.log(transactions);


    // Process skills data
    const skillMap = new Map();
    transactions.forEach(tx => {
        const skill = tx.type;
        if (skillMap.has(skill)) {
            if (tx.amount >= skillMap.get(skill)) {
                skillMap.set(skill, tx.amount);


            }


        } else {

            skillMap.set(skill, tx.amount);

        }
    });
    console.log(skillMap);


    const skills = Array.from(skillMap.entries())
        .map(([type, amount]) => ({ type, amount }))
        .filter(skill => skill.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8);

    if (skills.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No skills data available</p>';
        return;
    }



    const width = 400;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.background = 'radial-gradient(circle, #f8f9fa 0%, #e9ecef 100%)';
    svg.style.borderRadius = '10px';

    // Create gradient for bars
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'barGradient');
    gradient.innerHTML = `
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    `;
    defs.appendChild(gradient);
    svg.appendChild(defs);

    // Scales
    const maxAmount = 100;
    const barWidth = chartWidth / skills.length;

    skills.forEach((skill, i) => {
        const x = margin.left + i * barWidth;
        const barHeight = (skill.amount / maxAmount) * chartHeight;
        const y = margin.top + chartHeight - barHeight;

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', barWidth - 5);
        rect.setAttribute('height', barHeight);
        rect.setAttribute('fill', 'url(#barGradient)');
        rect.setAttribute('opacity', '0.8');
        rect.setAttribute('stroke', 'white');
        rect.setAttribute('stroke-width', '1');
        rect.style.cursor = 'pointer';

        // Tooltip on hover
        rect.addEventListener('mouseover', (e) => {
            rect.setAttribute('opacity', '1');
            showEnhancedTooltip(e, {
                skill: skill.type,
                percentage: Math.round((skill.amount / maxAmount) * 100)
            });
        });

        rect.addEventListener('mouseout', () => {
            rect.setAttribute('opacity', '0.8');
            hideEnhancedTooltip();
        });

        svg.appendChild(rect);

        // Add skill labels (inside bars)

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x + barWidth / 2);
        label.setAttribute('y', 280); // 15px below the top of the bar
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', '#000000ff'); // White for contrast against gradient
        label.setAttribute('font-size', '10px');
        label.setAttribute('font-weight', '500');
        label.textContent = just(skill.type);
        svg.appendChild(label);

    });

    // Draw grid lines
    const yGridTicks = 5;
    let l = 100
    for (let i = 0; i <= yGridTicks; i++) {
        const y = margin.top + (i / yGridTicks) * chartHeight;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', margin.left);
        line.setAttribute('y1', y);
        line.setAttribute('x2', width - margin.right);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#ddd');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);

        // Y-axis labels
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', margin.left - 10);
        label.setAttribute('y', y + 5);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('fill', '#666');
        label.setAttribute('font-size', '10px');
        label.textContent = `${l}`;
        l -= 20
        svg.appendChild(label);
    }

    // Draw axes
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', margin.left);
    xAxis.setAttribute('y1', height - margin.bottom);
    xAxis.setAttribute('x2', width - margin.right);
    xAxis.setAttribute('y2', height - margin.bottom);
    xAxis.setAttribute('stroke', '#666');
    xAxis.setAttribute('stroke-width', '2');
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', margin.left);
    yAxis.setAttribute('y1', margin.top);
    yAxis.setAttribute('x2', margin.left);
    yAxis.setAttribute('y2', height - margin.bottom);
    yAxis.setAttribute('stroke', '#666');
    yAxis.setAttribute('stroke-width', '2');
    svg.appendChild(yAxis);

    // Add axes labels
    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', width / 2);
    xLabel.setAttribute('y', height - 10);
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('fill', '#666');
    xLabel.setAttribute('font-size', '12px');
    xLabel.textContent = 'Skills';
    svg.appendChild(xLabel);

    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('x', 15);
    yLabel.setAttribute('y', height / 2);
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('transform', `rotate(-90, 15, ${height / 2})`);
    yLabel.setAttribute('fill', '#666');
    yLabel.setAttribute('font-size', '12px');
    yLabel.textContent = 'XP Amount';
    svg.appendChild(yLabel);

    container.appendChild(svg);
}

// Enhanced tooltip functions
function showEnhancedTooltip(event, data) {
    hideEnhancedTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.zIndex = '1000';
    tooltip.style.pointerEvents = 'none';

    let content = '';
    if (data.project) {
        content = `
            <strong>${data.project}</strong><br>
            XP: +${(data.xp / 1024).toFixed(1)}K<br>
            Total: ${(data.total / 1024).toFixed(1)}K<br>
            <small>${data.date}</small>
        `;
    } else if (data.skill) {
        content = `
            <strong>${data.skill}</strong><br>
            ${data.percentage}% of max
        `;
    }

    tooltip.innerHTML = content;
    document.body.appendChild(tooltip);

    // Position tooltip
    const rect = tooltip.getBoundingClientRect();
    const x = event.clientX + 10;
    const y = event.clientY - rect.height - 10;

    tooltip.style.left = Math.min(x, window.innerWidth - rect.width - 10) + 'px';
    tooltip.style.top = Math.max(y, 10) + 'px';

    // Fade in effect
    setTimeout(() => {
        tooltip.style.opacity = '1';
    }, 10);
}

function hideEnhancedTooltip() {
    const existingTooltip = document.querySelector('.tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
}

function just(str) {
    let b = str.indexOf('_')

    return str.slice(b + 1)

}
window.addEventListener('beforeunload', (e) => {
    const savedToken = localStorage.getItem('jwtToken');

    if (!savedToken) {

        handleLogout()
    }

    try {
        graphqlQuery(GET_USER_INFO)



    } catch (err) {
        console.log(6666);
        
        handleLogout()


    }



});