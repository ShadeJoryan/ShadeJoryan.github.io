function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    // Safety check to handle event target mapping across various browser engines
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function runSimulation() {
    // 1. Parse MapleScouter Grid Inputs
    const strBase = parseFloat(document.getElementById('str-base').value) || 0;
    const strPct  = (parseFloat(document.getElementById('str-pct').value) || 0) / 100;
    const strFlat = parseFloat(document.getElementById('str-flat').value) || 0;

    const dexBase = parseFloat(document.getElementById('dex-base').value) || 0;
    const dexPct  = (parseFloat(document.getElementById('dex-pct').value) || 0) / 100;
    const dexFlat = parseFloat(document.getElementById('dex-flat').value) || 0;

    const attBase = parseFloat(document.getElementById('att-base').value) || 0;
    const attPct  = (parseFloat(document.getElementById('att-pct').value) || 0) / 100;
    const attFlat = parseFloat(document.getElementById('att-flat').value) || 0;

    // Standard Modifiers
    const dmg = (parseFloat(document.getElementById('stat-dmg').value) || 0) / 100;
    const bossDmg = (parseFloat(document.getElementById('stat-boss-dmg').value) || 0) / 100;
    const finalDmg = (parseFloat(document.getElementById('stat-final-dmg').value) || 0) / 100;
    const critDmg = (parseFloat(document.getElementById('stat-crit-dmg').value) || 0) / 100;
    const ied = (parseFloat(document.getElementById('stat-ied').value) || 0) / 100;
    const enemyDef = (parseFloat(document.getElementById('enemy-def').value) || 0) / 100;
    const maxTime = parseFloat(document.getElementById('sim-duration').value) || 0;

    // 2. Official MapleStory Math Formula Parsing Block
    // Calculated Stat = floor(Base * (1 + %)) + % Not Applied
    const absoluteSTR = Math.floor(strBase * (1 + strPct)) + strFlat;
    const absoluteDEX = Math.floor(dexBase * (1 + dexPct)) + dexFlat;
    const absoluteATT = Math.floor(attBase * (1 + attPct)) + attFlat;

    // Multipliers Specific to Shade's Knuckle layout profile
    const weaponConstant = 1.7; 
    const statMultiplier = (4 * absoluteSTR) + absoluteDEX;

    // Calculate Core Baseline Damage range limits
    const baseDamageRange = 0.01 * weaponConstant * statMultiplier * absoluteATT * (1 + dmg + bossDmg) * (1 + finalDmg);
    
    // Process Critical Hits and Boss Defenses 
    const criticalDamageMultiplier = 1.35 + critDmg; 
    const ignoreDefenseMultiplier = Math.max(0, 1 - (enemyDef * (1 - ied)));

    // Combined structural scalar for the simulation loop logic
    const absoluteDamageMultiplier = baseDamageRange * criticalDamageMultiplier * ignoreDefenseMultiplier;

    let currentTime = 0;
    let totalDamageDealt = 0;

    const skillData = {
        "Spirit Claw": { damage: 0, uses: 0, skillMultiplier: 8.5, delay: 0.8 },
        "Fox Spirits (Proc)": { damage: 0, uses: 0, skillMultiplier: 2.2, delay: 0.0 }
    };

    // 3. Logic Simulation Loop
    while (currentTime < maxTime) {
        let mainSkill = skillData["Spirit Claw"];
        let baseSkillDamage = absoluteDamageMultiplier * mainSkill.skillMultiplier;
        
        mainSkill.damage += baseSkillDamage;
        mainSkill.uses += 1;
        totalDamageDealt += baseSkillDamage;

        if (Math.random() < 0.40) {
            let procSkill = skillData["Fox Spirits (Proc)"];
            let procDamage = absoluteDamageMultiplier * procSkill.skillMultiplier;
            procSkill.damage += procDamage;
            procSkill.uses += 1;
            totalDamageDealt += procDamage;
        }

        currentTime += mainSkill.delay;
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
