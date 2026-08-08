/*Tables*/
-- Table for storing user information
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing project information
CREATE TABLE projects (
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(150) NOT NULL,
    description TEXT,
    owner_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id)
);

-- Table for storing project members
CREATE TABle project_members (
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Table for storing resources associated with projects
CREATE TABLE resources (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    uploaded_by INT NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);

-- Table for storing tasks associated with projects
CREATE TABLE tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    assigned_to INT,
    task_title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);

-- Table for storing messages associated with projects
CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Table for storing AI-generated ideas associated with projects
CREATE TABLE ai_ideas (
    idea_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    created_by INT NOT NULL,
    prompt TEXT NOT NULL,
    generated_idea TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Table for storing notifications for users
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_id INT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Table for storing project milestones
CREATE TABLE project_milestones (
    milestone_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    milestone_name VARCHAR(150) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);