function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function runSimulation() {
    // 1. Parse Inputs
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
    const critDmg = (parseFloat(document.getElementById('stat-crit-dmg').value) || 0) / 100; // e.g. 132.9
    const ied = (parseFloat(document.getElementById('stat-ied').value) || 0) / 100;
    
    const elemResist = (parseFloat(document.getElementById('stat-elem-resist').value) || 0) / 100;
    const enemyDef = (parseFloat(document.getElementById('enemy-def').value) || 0) / 100;
    const enemyLevel = parseFloat(document.getElementById('enemy-level').value) || 0;
    const maxTime = parseFloat(document.getElementById('sim-duration').value) || 0;

    // 2. Direct Implementation of Your Custom Formula Structure:
    // Equation: (4 * (STR_base * (1 + STR_pct) + STR_flat) + (DEX_base * (1 + DEX_pct) + DEX_flat)) 
    //           * ((ATT_base * (1 + ATT_pct) + ATT_flat) / 100) 
    //           * wepmodifier 
    //           * (1 + stat-boss-dmg + stat-dmg) 
    //           * (35 + stat-crit-dmg) 
    //           * (1 - (enemy-def * (1 - stat-ied))) 
    //           * (0.5 * (1 + stat-elem-resist)) 
    //           * final-dmg 
    //           * skill-dmg%

    const absoluteSTR = (strBase * (1 + strPct)) + strFlat;
    const absoluteDEX = (dexBase * (1 + dexPct)) + dexFlat;
    const absoluteATT = (attBase * (1 + attPct)) + attFlat;

    const wepmodifier = 1.7; 
    const finalDmgPlaceholder = 1.2; // Temporary level-diff scalar placeholder as requested

    const statBracket = (4 * absoluteSTR) + absoluteDEX;
    const attBracket = absoluteATT / 100;
    const dmgBracket = 1 + bossDmg + dmg;
    const critBracket = 35 + critDmg;
    const defenseBracket = Math.max(0, 1 - (enemyDef * (1 - ied)));
    const elemBracket = 0.5 * (1 + elemResist);

    // Core damage multiplier per 1% skill damage component before skill scaling
    const baseDamageMultiplier = statBracket * attBracket * wepmodifier * dmgBracket * critBracket * defenseBracket * elemBracket * finalDmgPlaceholder;

    let currentTime = 0;
    let totalDamageDealt = 0;

    // Skill configuration: HEXA Spirit Claw
    const skillData = {
        "HEXA Spirit Claw": { 
            damage: 0, 
            uses: 0, 
            skillMultiplier: 12.56, // 1027% expressed as decimal multiplier
            hits: 13, 
            delay: 0.42             // 420 milliseconds in seconds
        }
    };

    // 3. Logic Simulation Loop
    while (currentTime < maxTime) {
        let skill = skillData["HEXA Spirit Claw"];
        
        // Damage calculation per skill activation considering multi-hit lines
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
