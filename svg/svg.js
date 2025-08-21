export function generateEnhancedXPGraph(transactions) {
    const container = document.getElementById('xpBubbleGraph');

    container.innerHTML = '';
       console.log(transactions);
       
    
    const data = transactions

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
    const margin = { top: 40, right: 50, bottom: 40, left: 50 };

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
    svg.style.borderRadius = '10px';


    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Scales
    // const minDate = Math.min(...processedData.map(d => d.date.getTime()));
    // const maxDate = Math.max(...processedData.map(d => d.date.getTime()));
    const maxXP = Math.max(...processedData.map(d => d.cumulativeXP));
    const minXP = Math.min(...processedData.map(d => d.cumulativeXP));


    // Draw animated line
    const pathData = processedData.map((d, i) => {
        const x = margin.left + (i / (processedData.length - 1)) * chartWidth;
        const y = margin.top + chartHeight - ((d.cumulativeXP - minXP) / (maxXP - minXP)) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    console.log(pathData);


    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#764ba2');
    path.setAttribute('stroke-width', '3');

    svg.appendChild(path);

    // Draw enhanced bubbles
    processedData.forEach((d, i) => {
        const x = margin.left + (i / (processedData.length - 1)) * chartWidth;
        const y = margin.top + chartHeight - ((d.cumulativeXP - minXP) / (maxXP - minXP)) * chartHeight;
        const radius = Math.min(Math.max(Math.sqrt(Math.abs(d.amount)) / 50, 4), 15);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', '#764ba2');
        circle.setAttribute('opacity', '0.8');
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2');
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
export function generateEnhancedSkillsGraph(skillsData) {
    const container = document.getElementById('skillsPolarGraph');
    container.innerHTML = '';



    const data = skillsData
    const transactions = data.user[0].transactions || [];


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



    // Scales
    const maxAmount = 100;
    const barWidth = chartWidth / skills.length;

    skills.forEach((skill, i) => {
        const x = margin.left + i * barWidth;
        const barHeight = (skill.amount / maxAmount) * chartHeight;
        const y =  margin.top +chartHeight - barHeight;

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', barWidth - 5);
        rect.setAttribute('height', barHeight);
        rect.setAttribute('fill', '#764ba2');
        rect.setAttribute('opacity', '0.8');
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
        label.setAttribute('y', 280); 
        label.setAttribute('fill', '#000000ff'); 
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
    yLabel.setAttribute('fill', '#630a0aff');
    yLabel.setAttribute('font-size', '12px');
    yLabel.textContent = 'XP Amount';
    svg.appendChild(yLabel);

    container.appendChild(svg);
}
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
            XP: ${(data.xp / 1024).toFixed(1)}K<br>
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

    str =  str.slice(b + 1)

    for(let i = str.length-1;i>=0;i--){

        if(str[i]=='-'){
            str = str.slice(0,i)
            break
        }
    }
    return str

}

// function piscine(str){
//     str = str.split(' ')
//     if(str[0]==)
// }