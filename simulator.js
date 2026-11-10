// RUNS IMMEDIATELY: Restores the last active tab from memory on page refresh
document.addEventListener('DOMContentLoaded', () => {
    const savedTab = localStorage.getItem('shade_sim_active_tab');
    if (savedTab) {
        switchTab(savedTab);
    }

    // Auto-load and sync all number input values from localStorage
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        const savedValue = localStorage.getItem(`shade_sim_${input.id}`);
        if (savedValue !== null) {
            input.value = savedValue;
        }

        input.addEventListener('input', () => {
            localStorage.setItem(`shade_sim_${input.id}`, input.value);
        });
    });
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    const associatedBtn = document.querySelector(`button[onclick*="${tabId}"]`);
    if (associatedBtn) {
        associatedBtn.classList.add('active');
    }

    localStorage.setItem('shade_sim_active_tab', tabId);
}

function exportProfile() {
    const inputs = document.querySelectorAll('input[type="number"]');
    const profileData = {};
    
    inputs.forEach(input => {
        if (input.id) {
            profileData[input.id] = input.value;
        }
    });

    try {
        const jsonString = JSON.stringify(profileData);
        const encodedString = btoa(unescape(encodeURIComponent(jsonString)));
        const textBox = document.getElementById('profile-string-box');
        textBox.value = encodedString;
        textBox.select();
        document.execCommand('copy');
        alert("Profile exported and copied to clipboard successfully!");
    } catch (error) {
        alert("Error exporting profile data.");
        console.error(error);
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
        const decodedString = decodeURIComponent(escape(atob(rawValue)));
        const importedData = JSON.parse(decodedString);
        
        Object.keys(importedData).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = importedData[id];
                // Fixed syntax error here by adding comment slashes:
                localStorage.setItem(`shade_sim_${id}`, importedData[id]);
            }
        });
        
        alert("Character profile settings updated successfully!");
        inputBox.value = ""; 
        
   } catch (error) {
        alert("Error: Invalid profile layout code string. Make sure you copied the text completely.");
        console.error(error);
    }
}

function runSimulation() {
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

    if (maxTime <= 0) {
        alert("Please specify a simulation duration greater than 0 seconds.");
        return;
    }

    const absoluteSTR = Math.floor((strBase * (1 + strPct)) + strFlat);
    const absoluteDEX = Math.floor(dexBase * (1 + dexPct)) + dexFlat);
    const absoluteATT = Math.floor((attBase * (1 + attPct)) + attFlat);

    const wepmodifier = 1.7; 
    const finalDmgPlaceholder = 1+1.9602924065 ; 

    const statBracket = (4 * absoluteSTR) + absoluteDEX;
    const attBracket = absoluteATT / 100;
    const dmgBracket = 1 + bossDmg + dmg;
    const critBracket = 1.35 + critDmg;
    const defenseBracket = Math.max(0, 1 - (enemyDef * (1 - ied)));
    const elemBracket = 0.5 * (1 + elemResist);

    const baseDamageMultiplier = statBracket * attBracket * wepmodifier * dmgBracket * critBracket * defenseBracket * elemBracket * finalDmgPlaceholder;
    
    const damageRange = Math.round(Math.round(statBracket * attBracket * wepmodifier) * (1 + dmg) * finalDmgPlaceholder); 
    
    let currentTime = 0;
    let totalDamageDealt = 0;

    const skillData = {
        "HEXA Spirit Claw": { 
            damage: 0, 
            uses: 0, 
            skillMultiplier: 10.27, 
            hits: 13, 
            delay: 0.42             
        }
    };

    while (currentTime < maxTime) {
        let skill = skillData["HEXA Spirit Claw"];
        
        let activationDamage = baseDamageMultiplier * skill.skillMultiplier * skill.hits;
        
        skill.damage += activationDamage;
        skill.uses += 1;
        totalDamageDealt += activationDamage;

        currentTime += skill.delay;
    }

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
