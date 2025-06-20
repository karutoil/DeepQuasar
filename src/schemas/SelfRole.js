const mongoose = require('mongoose');

const selfRoleSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        index: true
    },
    
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    
    channelId: {
        type: String,
        required: true
    },
    
    title: {
        type: String,
        required: true,
        maxLength: 256
    },
    
    description: {
        type: String,
        required: true,
        maxLength: 4096
    },
    
    color: {
        type: String,
        default: '#0099ff',
        validate: {
            validator: function(v) {
                return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
            },
            message: 'Color must be a valid hex color'
        }
    },
    
    roles: [{
        roleId: {
            type: String,
            required: true
        },
        roleName: {
            type: String,
            required: true
        },
        emoji: {
            type: String,
            default: null
        },
        label: {
            type: String,
            required: true,
            maxLength: 80
        },
        description: {
            type: String,
            maxLength: 100,
            default: null
        },
        style: {
            type: String,
            enum: ['Primary', 'Secondary', 'Success', 'Danger'],
            default: 'Primary'
        },
        position: {
            type: Number,
            default: 0
        },
        maxAssignments: {
            type: Number,
            default: null // null means unlimited
        },
        currentAssignments: {
            type: Number,
            default: 0
        },
        requiredRole: {
            type: String,
            default: null // Role ID required to assign this role
        },
        conflictingRoles: [{
            type: String // Role IDs that conflict with this role
        }]
    }],
    
    settings: {
        maxRolesPerUser: {
            type: Number,
            default: null // null means unlimited
        },
        allowRoleRemoval: {
            type: Boolean,
            default: true
        },
        requireConfirmation: {
            type: Boolean,
            default: false
        },
        ephemeralResponse: {
            type: Boolean,
            default: true
        },
        logChannel: {
            type: String,
            default: null
        },
        autoDelete: {
            enabled: {
                type: Boolean,
                default: false
            },
            deleteAfter: {
                type: Number,
                default: 3600000 // 1 hour in milliseconds
            }
        }
    },
    
    statistics: {
        totalInteractions: {
            type: Number,
            default: 0
        },
        uniqueUsers: [{
            userId: String,
            interactions: Number,
            lastInteraction: Date
        }],
        roleAssignments: [{
            roleId: String,
            assigned: Number,
            removed: Number
        }]
    },
    
    createdBy: {
        userId: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true
        }
    },
    
    lastModified: {
        by: {
            userId: String,
            username: String
        },
        at: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
selfRoleSchema.index({ guildId: 1, messageId: 1 });
selfRoleSchema.index({ guildId: 1, channelId: 1 });
selfRoleSchema.index({ 'roles.roleId': 1 });

// Pre-save middleware to update lastModified
selfRoleSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.lastModified.at = new Date();
    }
    next();
});

// Methods
selfRoleSchema.methods.addRole = function(roleData) {
    const existingRole = this.roles.find(r => r.roleId === roleData.roleId);
    if (existingRole) {
        throw new Error('Role already exists in this self-role message');
    }
    
    this.roles.push(roleData);
    this.roles.sort((a, b) => a.position - b.position);
    return this;
};

selfRoleSchema.methods.removeRole = function(roleId) {
    const roleIndex = this.roles.findIndex(r => r.roleId === roleId);
    if (roleIndex === -1) {
        throw new Error('Role not found in this self-role message');
    }
    
    this.roles.splice(roleIndex, 1);
    return this;
};

selfRoleSchema.methods.updateRole = function(roleId, updateData) {
    const role = this.roles.find(r => r.roleId === roleId);
    if (!role) {
        throw new Error('Role not found in this self-role message');
    }
    
    Object.assign(role, updateData);
    this.roles.sort((a, b) => a.position - b.position);
    return this;
};

selfRoleSchema.methods.canUserAssignRole = function(userId, roleId, userRoles) {
    const role = this.roles.find(r => r.roleId === roleId);
    if (!role) return { allowed: false, reason: 'Role not found' };
    
    // Check if user already has maximum roles
    if (this.settings.maxRolesPerUser) {
        const userSelfRoles = userRoles.filter(userRole => 
            this.roles.some(selfRole => selfRole.roleId === userRole.id)
        );
        if (userSelfRoles.length >= this.settings.maxRolesPerUser) {
            return { allowed: false, reason: `Maximum of ${this.settings.maxRolesPerUser} self-roles allowed` };
        }
    }
    
    // Check if role has reached maximum assignments
    if (role.maxAssignments && role.currentAssignments >= role.maxAssignments) {
        return { allowed: false, reason: 'Role assignment limit reached' };
    }
    
    // Check if user has required role
    if (role.requiredRole && !userRoles.some(userRole => userRole.id === role.requiredRole)) {
        return { allowed: false, reason: 'Required role not found' };
    }
    
    // Check for conflicting roles
    const conflictingRole = role.conflictingRoles.find(conflictId => 
        userRoles.some(userRole => userRole.id === conflictId)
    );
    if (conflictingRole) {
        return { allowed: false, reason: 'Conflicting role detected' };
    }
    
    return { allowed: true };
};

selfRoleSchema.methods.incrementRoleAssignment = function(roleId) {
    const role = this.roles.find(r => r.roleId === roleId);
    if (role) {
        role.currentAssignments += 1;
    }
    
    let roleStats = this.statistics.roleAssignments.find(r => r.roleId === roleId);
    if (!roleStats) {
        roleStats = { roleId, assigned: 0, removed: 0 };
        this.statistics.roleAssignments.push(roleStats);
    }
    roleStats.assigned += 1;
};

selfRoleSchema.methods.decrementRoleAssignment = function(roleId) {
    const role = this.roles.find(r => r.roleId === roleId);
    if (role && role.currentAssignments > 0) {
        role.currentAssignments -= 1;
    }
    
    let roleStats = this.statistics.roleAssignments.find(r => r.roleId === roleId);
    if (!roleStats) {
        roleStats = { roleId, assigned: 0, removed: 0 };
        this.statistics.roleAssignments.push(roleStats);
    }
    roleStats.removed += 1;
};

selfRoleSchema.methods.updateUserStats = function(userId) {
    this.statistics.totalInteractions += 1;
    
    let userStats = this.statistics.uniqueUsers.find(u => u.userId === userId);
    if (!userStats) {
        userStats = { userId, interactions: 0, lastInteraction: new Date() };
        this.statistics.uniqueUsers.push(userStats);
    }
    userStats.interactions += 1;
    userStats.lastInteraction = new Date();
};

module.exports = mongoose.model('SelfRole', selfRoleSchema);
