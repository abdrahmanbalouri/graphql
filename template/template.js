export const login = `<div class="container">
       

            <form id="loginForm" class="login-form">
                <h2>Login </h2>
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="login-btn">Login</button>
                <div id="errorMessage" class="error-message" style="display: none;"></div>
            </form>`

export const profile = ` <div id="profileSection" class="profile-section">
            <div class="profile-header">
                <div class="user-info">
                    <h2 id="userName">Loading...</h2>
                    <p id="userLevel">Level: Loading...</p>
                </div>
                <button id="logoutBtn" class="logout-btn">Logout</button>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h3 id="auditRatio">--</h3>
                    <p>Audit Ratio</p>
                </div>
                <div class="stat-card">
                    <h3 id="passedAudits">--</h3>
                    <p>Passed Audits</p>
                </div>
                <div class="stat-card">
                    <h3 id="failedAudits">--</h3>
                    <p>Failed Audits</p>
                </div>
                <div class="stat-card">
                    <h3 id="totalXP">--</h3>
                    <p>Total XP</p>
                </div>
            </div>

            <div class="graphs-section">
                <div class="graph-container">
                    <div class="graph-title">XP Progress Timeline </div>
                    <div id="xpBubbleGraph" class="graph-content"></div>
                </div>
                <div class="graph-container">
                    <div class="graph-title">Skills</div>
                    <div id="skillsPolarGraph" class="graph-content"></div>
                </div>
            </div>
        </div>`