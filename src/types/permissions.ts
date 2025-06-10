export interface ActionPermission {
	access: 'none' | 'partial' | 'full';
	fields?: string[];
	presets?: Record<string, any>;
}

export interface CollectionPermissions {
	create: ActionPermission;
	read: ActionPermission;
	update: ActionPermission;
	delete: ActionPermission;
	share: ActionPermission;
}

export type UserPermissionsData = Record<string, CollectionPermissions>;
