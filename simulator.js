// RUNS IMMEDIATELY: Restores the last active tab from memory on page refresh
document.addEventListener('DOMContentLoaded', () => {
    const savedTab = localStorage.getItem('shade_sim_active_tab');
    if (savedTab) {
        switchTab(savedTab);
    }
});

function switchTab(tabId) {
    // 1. Hide all tab panes and clear active classes from buttons
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    // 2. Activate target tab content window
    document.getElementById(tabId).classList.add('active');
    
    // 3. Find the exact navigation button matching this tab ID and mark it active
    const associatedBtn = document.querySelector(`button[onclick*="${tabId}"]`);
    if (associatedBtn) {
        associatedBtn.classList.add('active');
    }

    // 4. Save the current tab view to browser memory
    localStorage.setItem('shade_sim_active_tab', tabId);
}

function runSimulation() {
    // 1. Parse Inputs (Will automatically look at the auto-restored values inside the HTML)
    const charLevel = parseFloat(document.getElementById('char-level').value) || 0;

    const strBase = parseFloat(document.getElementById('str-base').value) || 0;
    const strPct  = (parseFloat(document.getElementById('str-pct').value) || 0) / 100;
    const strFlat = parseFloat(document.getElementById('str-flat').value) || 0;

    const dexBase = parseFloat(document.getElementById('dex-base').value) || 0;
    const dexPct  = (parseFloat(document.getElementById('dex-pct').value) || 0) / 100;
    const dexFlat = parseFloat(document.getElementById('dex-flat').value) || 0;

    const attBase = parseFloat(document.getElementById('att-base').value) || 0;
    const attPct  = (parseFloat(document.getElementById('att-pct').value) || 0) / 100;
    const attFlat = parseFloat(document.getElementById('att-flat').value) || 0;

    const dmg = (parseFloat(document.getElementById('stat-dmg').value) || 0) / 100;
    const bossDmg = (parseFloat(document.getElementById('stat-boss-dmg').value) || 0) / 100;
    const critDmg = (parseFloat(document.getElementById('stat-crit-dmg').value) || 0) / 100; 
    const ied = (parseFloat(document.getElementById('stat-ied').value) || 0) / 100;
    
    const elemResist = (parseFloat(document.getElementById('stat-elem-resist').value) || 0) / 100;
    const enemyDef = (parseFloat(document.getElementById('enemy-def').value) || 0) / 100;
    const enemyLevel = parseFloat(document.getElementById('enemy-level').value) || 0;
    const maxTime = parseFloat(document.getElementById('sim-duration').value) || 0;

    // Guard statement to prevent browser freezing if duration is 0 or empty
    if (maxTime <= 0) {
        alert("Please specify a simulation duration greater than 0 seconds.");
        return;
    }

    // 2. Direct Implementation of Your Custom Formula Structure:
    const absoluteSTR = (strBase * (1 + strPct)) + strFlat;
    const absoluteDEX = (dexBase * (1 + dexPct)) + dexFlat;
    const absoluteATT = (attBase * (1 + attPct)) + attFlat;

    const wepmodifier = 1.7; 
    const finalDmgPlaceholder = 1.2; 

    const statBracket = (4 * absoluteSTR) + absoluteDEX;
    const attBracket = absoluteATT / 100;
    const dmgBracket = 1 + bossDmg + dmg;
    const critBracket = 35 + critDmg;
    const defenseBracket = Math.max(0, 1 - (enemyDef * (1 - ied)));
    const elemBracket = 0.5 * (1 + elemResist);

    const baseDamageMultiplier = statBracket * attBracket * wepmodifier * dmgBracket * critBracket * defenseBracket * elemBracket * finalDmgPlaceholder;

    let currentTime = 0;
    let totalDamageDealt = 0;

    // Skill configuration: HEXA Spirit Claw
    const skillData = {
        "HEXA Spirit Claw": { 
            damage: 0, 
            uses: 0, 
            skillMultiplier: 10.27, 
            hits: 13, 
            delay: 0.42             
        }
    };

    // 3. Logic Simulation Loop
    while (currentTime < maxTime) {
        let skill = skillData["HEXA Spirit Claw"];
        
        let activationDamage = baseDamageMultiplier * skill.skillMultiplier * skill.hits;
        
        skill.damage += activationDamage;
        skill.uses += 1;
        totalDamageDealt += activationDamage;

        currentTime += skill.delay;
    }

    // 4. Update the Battle Analysis UI Tables
    document.getElementById('ba-time').innerText = `${maxTime}s`;
    document.getElementById('ba-total-dmg').innerText = Math.floor(totalDamageDealt).toLocaleString();
    document.getElementById('ba-avg-dmg').innerText = `${Math.floor(totalDamageDealt / maxTime).toLocaleString()}/s`;

    const tableBody = document.getElementById('ba-table-body');
    tableBody.innerHTML = ""; 

    for (let [name, data] of Object.entries(skillData)) {
        if (data.uses === 0) continue;
        
        let contribution = ((data.damage / totalDamageDealt) * 100).toFixed(2);
        let avgSec = (data.damage / maxTime).toFixed(0);
        let avgHit = (data.damage / data.uses).toFixed(0);

        let row = `<tr>
            <td style="color:#63b3ed; font-weight:bold;">${name}</td>
            <td>${Math.floor(data.damage).toLocaleString()}</td>
            <td>${contribution}%</td>
            <td>${parseInt(avgSec).toLocaleString()}/s</td>
            <td>${data.uses}</td>
            <td>${parseInt(avgHit).toLocaleString()}</td>
        </tr>`;
        tableBody.innerHTML += row;
    }
}
function importProfile() {
    const inputBox = document.getElementById('profile-string-box');
    const rawValue = inputBox.value.trim();
    
    if (!rawValue) {
        alert("Please paste a valid profile data string into the text window first.");
        return;
    }
    
    try {
        // Decode the base64 string back into readable JSON configuration blocks
        const decodedString = decodeURIComponent(escape(atob(rawValue)));
        const importedData = JSON.parse(decodedString);
        
        // Loop through the data parameters and inject them back into matching HTML input positions
        Object.keys(importedData).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = importedData[id];
               // Update LocalStorage tracking simultaneously so the memory updates instantly
                localStorage.setItem(`shade_sim_${id}`, importedData[id]);
            }
        });
        
        alert("Character profile settings updated successfully!");
        inputBox.value = ""; // Clear text field window after successful ingestion
        
   } catch (error) {
        alert("Error: Invalid profile layout code string. Make sure you copied the text completely.");
        console.error(error);
    }
}
