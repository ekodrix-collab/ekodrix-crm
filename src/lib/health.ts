import { ProjectVault, ProjectHealth } from '@/types/hub';

/**
 * Computes health score for a project based on required vault credentials.
 * If no vault items are marked required, default is healthy.
 */
export function calculateProjectHealth(vaults: ProjectVault[] = []): ProjectHealth {
  const requiredVaults = vaults.filter((v) => v.is_required);
  
  // If no required vaults configured yet, check total vaults
  const targetVaults = requiredVaults.length > 0 ? requiredVaults : vaults;

  if (targetVaults.length === 0) {
    return {
      percentage: 0,
      status: 'risk',
      color: 'red',
      filled: 0,
      total: 0,
      missing: ['No Vault Items Configured'],
    };
  }

  const filledVaults = targetVaults.filter((v) => {
    // Check if is_filled is true or if primary fields (username/password/api_key/url) are present
    if (v.is_filled) return true;
    return !!(
      (v.username && v.password_encrypted) ||
      (v.api_key && v.access_token) ||
      (v.password_encrypted && v.url) ||
      (v.api_key && v.url) ||
      (v.ssh_key && v.username)
    );
  });

  const percentage = Math.round((filledVaults.length / targetVaults.length) * 100);

  let status: 'healthy' | 'warning' | 'risk' = 'risk';
  let color: 'green' | 'yellow' | 'red' = 'red';

  if (percentage === 100) {
    status = 'healthy';
    color = 'green';
  } else if (percentage >= 50) {
    status = 'warning';
    color = 'yellow';
  } else {
    status = 'risk';
    color = 'red';
  }

  const missing = targetVaults
    .filter((v) => !filledVaults.some((f) => f.id === v.id))
    .map((v) => v.label);

  return {
    percentage,
    status,
    color,
    filled: filledVaults.length,
    total: targetVaults.length,
    missing,
  };
}
