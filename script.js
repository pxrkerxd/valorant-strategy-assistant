let stratData = {};
let currentTeam = []; // State array to track selected agents

fetch('data.json')
    .then(response => response.json())
    .then(data => {
        stratData = data;
    })
    .catch(error => console.error("Error loading intel:", error));

function loadSection(section) {
    const contentDiv = document.getElementById('app-content');
    contentDiv.innerHTML = ''; 

    if (!stratData.maps) {
        contentDiv.innerHTML = '<p>Error: Data not loaded yet. Are you running Live Server?</p>';
        return;
    }

    if (section === 'maps') {
        let html = '<h2>Map Intel</h2><div class="grid-container">';
        stratData.maps.forEach((map, index) => {
            html += `
                <div class="card fade-in" style="animation-delay: ${index * 0.1}s">
                    <img src="${map.image}" alt="${map.name} Map Layout" class="card-img">
                    <div class="card-content">
                        <h3>${map.name}</h3>
                        <p><strong>Overview:</strong> ${map.description}</p>
                        <p><strong>Top Agents:</strong> ${map.bestAgents.join(', ')}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        contentDiv.innerHTML = html;
    } 
    else if (section === 'agents') {
        let html = `
            <div class="agent-header">
                <h2>Agent Data</h2>
                <select id="role-filter" onchange="renderAgents()">
                    <option value="All">All Roles</option>
                    <option value="Duelist">Duelist</option>
                    <option value="Controller">Controller</option>
                    <option value="Initiator">Initiator</option>
                    <option value="Sentinel">Sentinel</option>
                </select>
            </div>
            <div id="agent-grid" class="grid-container"></div>
        `;
        contentDiv.innerHTML = html;
        renderAgents(); 
    } 
    else if (section === 'comp') {
        // THE NEW TEAM BUILDER UI
        currentTeam = []; // Reset team when entering the tab
        let html = `
            <h2>Team Comp Rater</h2>
            <div class="card fade-in team-builder-dashboard">
                <div id="team-display" class="team-display">
                    <p style="text-align:center; width:100%; opacity:0.7;">Click on 5 agents below to build your comp.</p>
                </div>
                <button class="analyze-btn" onclick="analyzeTeam()">Analyze Composition</button>
            </div>
            <div id="comp-feedback" class="feedback-box"></div>
            <div id="comp-roster" class="comp-roster-grid fade-in" style="animation-delay: 0.2s;"></div>
        `;
        contentDiv.innerHTML = html;
        renderCompRoster();
    }
    else if (section === 'tips') {
        let html = '<h2>Beginner Competitive Tips</h2><div class="card fade-in"><ul>';
        stratData.tips.forEach(tip => {
            html += `<li>${tip}</li><br>`;
        });
        html += '</ul></div>';
        contentDiv.innerHTML = html;
    }
}

// Renders the agent list for the Agent Data tab
function renderAgents() {
    const gridDiv = document.getElementById('agent-grid');
    const selectedRole = document.getElementById('role-filter').value;
    gridDiv.innerHTML = ''; 
    
    const filteredAgents = stratData.agents.filter(agent => {
        if (selectedRole === 'All') return true;
        return agent.role === selectedRole;
    });

    let html = '';
    filteredAgents.forEach((agent, index) => {
        let strengths = agent.strengths.map(s => `<li>${s}</li>`).join('');
        let counters = agent.counters.map(c => `<li>${c}</li>`).join('');
        
        html += `
            <div class="card agent-card fade-in" style="animation-delay: ${index * 0.1}s">
                <img src="${agent.image}" alt="${agent.name}" class="card-img agent-img">
                <div class="card-content">
                    <h3>${agent.name} <span class="role-badge">${agent.role}</span></h3>
                    <p><strong>Strengths:</strong></p>
                    <ul>${strengths}</ul><br>
                    <p><strong>Counters:</strong></p>
                    <ul>${counters}</ul>
                </div>
            </div>
        `;
    });
    gridDiv.innerHTML = html;
}

// --- NEW COMP BUILDER FUNCTIONS ---

function renderCompRoster() {
    const rosterDiv = document.getElementById('comp-roster');
    let html = '';
    
    stratData.agents.forEach(agent => {
        const isSelected = currentTeam.find(a => a.id === agent.id);
        html += `
            <div class="roster-card ${isSelected ? 'selected-agent' : ''}" onclick="toggleAgent('${agent.id}')">
                <img src="${agent.image}" class="roster-img">
                <h4>${agent.name}</h4>
                <span class="role-badge" style="margin:0; font-size:0.6rem;">${agent.role}</span>
            </div>
        `;
    });
    rosterDiv.innerHTML = html;
    updateTeamDisplay();
}

function toggleAgent(agentId) {
    const agentIndex = currentTeam.findIndex(a => a.id === agentId);
    
    // If agent is already in team, remove them
    if (agentIndex > -1) {
        currentTeam.splice(agentIndex, 1); 
    } else {
        // If not in team, add them (up to 5 max)
        if (currentTeam.length < 5) {
            const agent = stratData.agents.find(a => a.id === agentId);
            currentTeam.push(agent);
        } else {
            alert("Your team is full! Click an agent to remove them first.");
        }
    }
    
    // Clear feedback when changes are made
    document.getElementById('comp-feedback').innerHTML = '';
    renderCompRoster(); // Refresh the grid
}

function updateTeamDisplay() {
    const displayDiv = document.getElementById('team-display');
    if (currentTeam.length === 0) {
        displayDiv.innerHTML = '<p style="text-align:center; width:100%; opacity:0.7;">Click on 5 agents below to build your comp.</p>';
        return;
    }
    
    let html = '';
    currentTeam.forEach(agent => {
        html += `
            <div class="selected-team-member">
                <img src="${agent.image}">
                <p>${agent.name}</p>
            </div>
        `;
    });
    displayDiv.innerHTML = html;
}

function analyzeTeam() {
    const feedbackDiv = document.getElementById('comp-feedback');
    
    if (currentTeam.length < 5) {
        feedbackDiv.innerHTML = `<div class="card" style="border-left: 4px solid #ff4655;"><h3 style="color:#ff4655;">Lock in 5 agents first!</h3><p>You currently have ${currentTeam.length} selected.</p></div>`;
        return;
    }

    let duelists = 0, controllers = 0, initiators = 0, sentinels = 0;
    
    currentTeam.forEach(agent => {
        if (agent.role === 'Duelist') duelists++;
        if (agent.role === 'Controller') controllers++;
        if (agent.role === 'Initiator') initiators++;
        if (agent.role === 'Sentinel') sentinels++;
    });

    let feedback = `<div class="card fade-in" style="border-left: 4px solid #50C878;"><h3>Tactical Analysis</h3><ul>`;

    // Controller Check
    if (controllers === 0) feedback += "<li>❌ <strong>No Smokes:</strong> Good luck crossing long sightlines. Operator players will destroy you.</li><br>";
    else if (controllers > 2) feedback += "<li>⚠️ <strong>Too Many Smokes:</strong> You're going to blind your own team. Where is the damage?</li><br>";
    else feedback += "<li>✅ <strong>Smokes:</strong> Controller presence is solid.</li><br>";

    // Initiator Check
    if (initiators === 0) feedback += "<li>❌ <strong>No Info:</strong> Entries are going to be brutal without an Initiator to clear angles or flash.</li><br>";
    else feedback += "<li>✅ <strong>Initiation:</strong> You have the utility to take space and gather info.</li><br>";

    // Sentinel Check
    if (sentinels === 0) feedback += "<li>❌ <strong>Open Flanks:</strong> No Sentinel means you have to manually watch your back every round.</li><br>";
    else feedback += "<li>✅ <strong>Flank Watch:</strong> Sentinel setups will secure your post-plants and defense.</li><br>";

    // Duelist Check
    if (duelists >= 3) feedback += "<li>⚠️ <strong>Ranked Demon Comp:</strong> 3+ Duelists? All aim, no brain. Hope you guys can win your 1v1s.</li><br>";
    else if (duelists === 0) feedback += "<li>⚠️ <strong>No Entry:</strong> Playing without a Duelist means someone else has to bravely run onto site first.</li><br>";
    else feedback += "<li>✅ <strong>Entry Power:</strong> Good Duelist balance. Let them lead the charge.</li><br>";

    // Perfect Comp Check
    if (controllers >= 1 && initiators >= 1 && sentinels >= 1 && duelists >= 1 && duelists <= 2) {
         feedback += "<h3 style='color:#50C878; margin-top:15px; text-shadow:none;'>🏆 RADIANT COMP</h3><p>Perfectly balanced. No excuses if you lose.</p>";
    }

    feedback += "</ul></div>";
    feedbackDiv.innerHTML = feedback;
}