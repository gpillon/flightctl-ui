import * as Yup from 'yup';
import { TFunction } from 'i18next';
import { ImageBuildFormValues } from './types';
import { ImageBuild } from '../useImageBuilds';

export const getInitialValues = (): ImageBuildFormValues => ({
  name: '',
  baseImage: '',
  baseImageRegistryCredentials: {
    username: '',
    password: '',
    skipTLSVerify: false,
  },
  customizations: {
    packages: [],
    coprRepos: [],
    files: [],
    scripts: [],
    systemdUnits: [],
    sshKeys: [],
    users: [],
  },
  bootcExports: [],
  flightctlConfig: {
    overrideEnrollmentService: false,
    enrollmentService: {
      server: '',
      certificateAuthorityData: '',
      clientCertificateData: '',
      clientKeyData: '',
      enrollmentUiEndpoint: '',
    },
    specFetchInterval: '60s',
    statusUpdateInterval: '60s',
    defaultLabels: {},
    systemInfo: [
      'hostname',
      'kernel',
      'distroName',
      'distroVersion',
      'productName',
      'productUuid',
      'productSerial',
      'netInterfaceDefault',
      'netIpDefault',
      'netMacDefault',
    ],
    systemInfoCustom: [],
    systemInfoTimeout: '2m',
    pullTimeout: '10m',
    logLevel: 'info',
    tpm: {
      enabled: false,
      devicePath: '/dev/tpm0',
      authEnabled: false,
      storageFilePath: '/var/lib/flightctl/tpm-blob.yaml',
    },
  },
  containerRegistry: {
    url: '',
    username: '',
    password: '',
  },
  pushToRegistry: false,
});

export const getInitialValuesFromImageBuild = (imageBuild: ImageBuild): ImageBuildFormValues => ({
  name: imageBuild.metadata.name || '',
  baseImage: imageBuild.spec.baseImage || '',
  baseImageRegistryCredentials: {
    username: imageBuild.spec.baseImageRegistryCredentials?.username || '',
    password: imageBuild.spec.baseImageRegistryCredentials?.password || '',
    skipTLSVerify: imageBuild.spec.baseImageRegistryCredentials?.skipTLSVerify || false,
  },
  customizations: {
    packages: imageBuild.spec.customizations?.packages || [],
    coprRepos: imageBuild.spec.customizations?.coprRepos || [],
    enableEpel: imageBuild.spec.customizations?.enableEpel || false,
    enablePodman: imageBuild.spec.customizations?.enablePodman || false,
    files: imageBuild.spec.customizations?.files || [],
    scripts: imageBuild.spec.customizations?.scripts || [],
    systemdUnits: imageBuild.spec.customizations?.systemdUnits || [],
    sshKeys: imageBuild.spec.customizations?.sshKeys || [],
    users: imageBuild.spec.customizations?.users || [],
  },
  bootcExports: imageBuild.spec.bootcExports || [],
  flightctlConfig: {
    overrideEnrollmentService: !!imageBuild.spec.flightctlConfig?.enrollmentService,
    enrollmentService: {
      server: imageBuild.spec.flightctlConfig?.enrollmentService?.service?.server || '',
      certificateAuthorityData:
        imageBuild.spec.flightctlConfig?.enrollmentService?.service?.certificateAuthorityData || '',
      clientCertificateData:
        imageBuild.spec.flightctlConfig?.enrollmentService?.authentication?.clientCertificateData || '',
      clientKeyData:
        imageBuild.spec.flightctlConfig?.enrollmentService?.authentication?.clientKeyData || '',
      enrollmentUiEndpoint: imageBuild.spec.flightctlConfig?.enrollmentService?.enrollmentUiEndpoint || '',
    },
    specFetchInterval: imageBuild.spec.flightctlConfig?.specFetchInterval || '60s',
    statusUpdateInterval: imageBuild.spec.flightctlConfig?.statusUpdateInterval || '60s',
    defaultLabels: imageBuild.spec.flightctlConfig?.defaultLabels || {},
    systemInfo: imageBuild.spec.flightctlConfig?.systemInfo || [
      'hostname',
      'kernel',
      'distroName',
      'distroVersion',
      'productName',
      'productUuid',
      'productSerial',
      'netInterfaceDefault',
      'netIpDefault',
      'netMacDefault',
    ],
    systemInfoCustom: imageBuild.spec.flightctlConfig?.systemInfoCustom || [],
    systemInfoTimeout: imageBuild.spec.flightctlConfig?.systemInfoTimeout || '2m',
    pullTimeout: imageBuild.spec.flightctlConfig?.pullTimeout || '10m',
    logLevel: imageBuild.spec.flightctlConfig?.logLevel || 'info',
    tpm: {
      enabled: imageBuild.spec.flightctlConfig?.tpm?.enabled || false,
      devicePath: imageBuild.spec.flightctlConfig?.tpm?.devicePath || '/dev/tpm0',
      authEnabled: imageBuild.spec.flightctlConfig?.tpm?.authEnabled || false,
      storageFilePath:
        imageBuild.spec.flightctlConfig?.tpm?.storageFilePath || '/var/lib/flightctl/tpm-blob.yaml',
    },
  },
  containerRegistry: {
    url: imageBuild.spec.containerRegistry?.url || '',
    username: imageBuild.spec.containerRegistry?.credentials?.username || '',
    password: imageBuild.spec.containerRegistry?.credentials?.password || '',
  },
  pushToRegistry: imageBuild.spec.pushToRegistry || false,
});

export const getValidationSchema = (t: TFunction) =>
  Yup.object({
    name: Yup.string()
      .required(t('Name is required'))
      .matches(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/, t('Name must be a valid Kubernetes resource name')),
    baseImage: Yup.string().required(t('Base image is required')),
    customizations: Yup.object({
      packages: Yup.array().of(Yup.string()),
      files: Yup.array().of(
        Yup.object({
          path: Yup.string().required(t('File path is required')),
          content: Yup.string(),
        }),
      ),
      scripts: Yup.array().of(
        Yup.object({
          path: Yup.string().required(t('Script path is required')),
          content: Yup.string().required(t('Script content is required')),
        }),
      ),
    }),
    flightctlConfig: Yup.object({
      overrideEnrollmentService: Yup.boolean(),
      enrollmentService: Yup.object({
        server: Yup.string().when('$overrideEnrollmentService', {
          is: true,
          then: (schema) => schema.required(t('Enrollment server is required')),
        }),
        certificateAuthorityData: Yup.string().when('$overrideEnrollmentService', {
          is: true,
          then: (schema) => schema.required(t('Certificate authority data is required')),
        }),
        clientCertificateData: Yup.string().when('$overrideEnrollmentService', {
          is: true,
          then: (schema) => schema.required(t('Client certificate data is required')),
        }),
        clientKeyData: Yup.string().when('$overrideEnrollmentService', {
          is: true,
          then: (schema) => schema.required(t('Client key data is required')),
        }),
        enrollmentUiEndpoint: Yup.string().when('$overrideEnrollmentService', {
          is: true,
          then: (schema) => schema.required(t('Enrollment UI endpoint is required')),
        }),
      }),
      specFetchInterval: Yup.string().matches(
        /^\d+[smh]$/,
        t('Must be a valid duration (e.g., 60s, 5m, 1h)'),
      ),
      statusUpdateInterval: Yup.string().matches(
        /^\d+[smh]$/,
        t('Must be a valid duration (e.g., 60s, 5m, 1h)'),
      ),
      systemInfoTimeout: Yup.string().matches(
        /^\d+[smh]$/,
        t('Must be a valid duration (e.g., 2m)'),
      ),
      pullTimeout: Yup.string().matches(
        /^\d+[smh]$/,
        t('Must be a valid duration (e.g., 10m)'),
      ),
      defaultLabels: Yup.object(),
      systemInfo: Yup.array().of(Yup.string()),
      systemInfoCustom: Yup.array().of(Yup.string()),
      logLevel: Yup.string().oneOf(
        ['panic', 'fatal', 'error', 'warn', 'warning', 'info', 'debug', 'trace'],
        t('Invalid log level'),
      ),
      tpm: Yup.object({
        enabled: Yup.boolean(),
        devicePath: Yup.string(),
        authEnabled: Yup.boolean(),
        storageFilePath: Yup.string(),
      }),
    }),
    containerRegistry: Yup.object({
      url: Yup.string().when('pushToRegistry', {
        is: true,
        then: (schema) => schema.required(t('Container registry URL is required when pushing to registry')),
      }),
      username: Yup.string(),
      password: Yup.string(),
    }),
    pushToRegistry: Yup.boolean(),
  });

export const generateContainerfile = (values: ImageBuildFormValues): string => {
  const lines: string[] = [];
  
  lines.push(`FROM ${values.baseImage}`);
  lines.push('');
  
  if (values.customizations.enableEpel) {
    lines.push('# Enable EPEL repositories');
    lines.push('RUN dnf -y install epel-release epel-next-release');
    lines.push('');
  }
  
  if (values.customizations.coprRepos.length > 0) {
    lines.push('# Enable COPR repositories');
    values.customizations.coprRepos.forEach((repo) => {
      lines.push(`RUN dnf copr enable -y ${repo}`);
    });
    lines.push('');
  }
  
  if (values.customizations.packages.length > 0) {
    lines.push('# Install packages');
    lines.push(`RUN dnf install -y ${values.customizations.packages.join(' ')}`);
    lines.push('');
  }
  
  if (values.customizations.files.length > 0) {
    lines.push('# Copy custom files');
    values.customizations.files.forEach((file) => {
      lines.push(`COPY <<EOF ${file.path}`);
      lines.push(file.content);
      lines.push('EOF');
    });
    lines.push('');
  }
  
  if (values.customizations.scripts.length > 0) {
    lines.push('# Custom scripts');
    values.customizations.scripts.forEach((script) => {
      lines.push(`RUN cat > ${script.path} <<'SCRIPT_EOF'`);
      lines.push(script.content);
      lines.push('SCRIPT_EOF');
      lines.push(`RUN chmod +x ${script.path}`);
    });
    lines.push('');
  }
  
  if (values.customizations.systemdUnits.length > 0) {
    lines.push('# Install systemd units');
    values.customizations.systemdUnits.forEach((unit) => {
      lines.push(`RUN cat > /etc/systemd/system/${unit.name} <<'UNIT_EOF'`);
      lines.push(unit.content);
      lines.push('UNIT_EOF');
      if (unit.enabled !== false) {
        lines.push(`RUN systemctl enable ${unit.name}`);
      }
    });
    lines.push('');
  }
  
  if (values.customizations.enablePodman) {
    lines.push('# Enable Podman service');
    lines.push('RUN systemctl enable podman.service');
    lines.push('');
  }
  
  if (values.customizations.sshKeys && values.customizations.sshKeys.length > 0) {
    lines.push('# SSH keys');
    lines.push('RUN mkdir -p /root/.ssh');
    values.customizations.sshKeys.forEach((key, idx) => {
      lines.push(`RUN echo "${key.replace(/"/g, '\\"')}" >> /root/.ssh/authorized_keys`);
    });
    lines.push('RUN chmod 700 /root/.ssh && chmod 600 /root/.ssh/authorized_keys');
    lines.push('');
  }
  
  if (values.customizations.users && values.customizations.users.length > 0) {
    lines.push('# Create users');
    values.customizations.users.forEach((user) => {
      const groups = user.groups && user.groups.length > 0 ? `-G ${user.groups.join(',')}` : '';
      const shell = user.shell ? `-s ${user.shell}` : '';
      lines.push(`RUN useradd ${groups} ${shell} ${user.name}`);
      
      if (user.password) {
        lines.push(`RUN echo "${user.name}:${user.password}" | chpasswd`);
      }
      
      if (user.sshKeys && user.sshKeys.length > 0) {
        lines.push(`RUN mkdir -p /home/${user.name}/.ssh`);
        user.sshKeys.forEach((key) => {
          lines.push(`RUN echo "${key.replace(/"/g, '\\"')}" >> /home/${user.name}/.ssh/authorized_keys`);
        });
        lines.push(`RUN chown -R ${user.name}:${user.name} /home/${user.name}/.ssh`);
        lines.push(`RUN chmod 700 /home/${user.name}/.ssh && chmod 600 /home/${user.name}/.ssh/authorized_keys`);
      }
    });
    lines.push('');
  }
  
  if (values.bootcExports && values.bootcExports.length > 0) {
    lines.push('# Bootc export formats');
    const exportTypes = values.bootcExports.map((exp) => {
      const arch = exp.architecture ? `--arch ${exp.architecture}` : '';
      return `${exp.type}${arch ? ` ${arch}` : ''}`;
    }).join(', ');
    lines.push(`# Will export as: ${exportTypes}`);
    lines.push('');
  }
  
  // Always add Flightctl agent installation
  lines.push('# Install Flightctl agent');
  lines.push('RUN dnf -y config-manager --add-repo https://rpm.flightctl.io/flightctl-epel.repo && \\');
  lines.push('    dnf -y install flightctl-agent && \\');
  lines.push('    dnf -y clean all && \\');
  lines.push('    systemctl enable flightctl-agent.service');
  lines.push('');
  
  // Always add Flightctl configuration
  lines.push('# Add Flightctl configuration');
  lines.push('ADD config.yaml /etc/flightctl/');
  lines.push('');
  
  return lines.join('\n');
};

export const getImageBuildResource = (values: ImageBuildFormValues): ImageBuild => ({
  apiVersion: 'flightctl.io/v1alpha1',
  kind: 'ImageBuild',
  metadata: {
    name: values.name,
  },
  spec: {
    baseImage: values.baseImage,
    baseImageRegistryCredentials: values.baseImageRegistryCredentials?.username || values.baseImageRegistryCredentials?.password || values.baseImageRegistryCredentials?.skipTLSVerify
      ? {
          username: values.baseImageRegistryCredentials.username,
          password: values.baseImageRegistryCredentials.password,
          skipTLSVerify: values.baseImageRegistryCredentials.skipTLSVerify,
        }
      : undefined,
    customizations: values.customizations.packages.length > 0 ||
      values.customizations.coprRepos.length > 0 ||
      values.customizations.enableEpel ||
      values.customizations.enablePodman ||
      values.customizations.files.length > 0 ||
      values.customizations.scripts.length > 0 ||
      values.customizations.systemdUnits.length > 0 ||
      (values.customizations.sshKeys && values.customizations.sshKeys.length > 0) ||
      (values.customizations.users && values.customizations.users.length > 0)
      ? {
          packages: values.customizations.packages.length > 0 ? values.customizations.packages : undefined,
          coprRepos: values.customizations.coprRepos.length > 0 ? values.customizations.coprRepos : undefined,
          enableEpel: values.customizations.enableEpel || undefined,
          enablePodman: values.customizations.enablePodman || undefined,
          files: values.customizations.files.length > 0 ? values.customizations.files : undefined,
          scripts: values.customizations.scripts.length > 0 ? values.customizations.scripts : undefined,
          systemdUnits: values.customizations.systemdUnits.length > 0 ? values.customizations.systemdUnits : undefined,
          sshKeys: values.customizations.sshKeys && values.customizations.sshKeys.length > 0 ? values.customizations.sshKeys : undefined,
          users: values.customizations.users && values.customizations.users.length > 0 ? values.customizations.users : undefined,
        }
      : undefined,
    bootcExports: values.bootcExports && values.bootcExports.length > 0 ? values.bootcExports : undefined,
    flightctlConfig: {
      enrollmentService: values.flightctlConfig.overrideEnrollmentService
        ? {
            service: {
              server: values.flightctlConfig.enrollmentService.server,
              certificateAuthorityData: values.flightctlConfig.enrollmentService.certificateAuthorityData,
            },
            authentication: {
              clientCertificateData: values.flightctlConfig.enrollmentService.clientCertificateData,
              clientKeyData: values.flightctlConfig.enrollmentService.clientKeyData,
            },
            enrollmentUiEndpoint: values.flightctlConfig.enrollmentService.enrollmentUiEndpoint,
          }
        : undefined,
      specFetchInterval: values.flightctlConfig.specFetchInterval || undefined,
      statusUpdateInterval: values.flightctlConfig.statusUpdateInterval || undefined,
      defaultLabels:
        Object.keys(values.flightctlConfig.defaultLabels).length > 0
          ? values.flightctlConfig.defaultLabels
          : undefined,
      systemInfo: values.flightctlConfig.systemInfo.length > 0 ? values.flightctlConfig.systemInfo : undefined,
      systemInfoCustom:
        values.flightctlConfig.systemInfoCustom.length > 0 ? values.flightctlConfig.systemInfoCustom : undefined,
      systemInfoTimeout: values.flightctlConfig.systemInfoTimeout || undefined,
      pullTimeout: values.flightctlConfig.pullTimeout || undefined,
      logLevel: values.flightctlConfig.logLevel || undefined,
      tpm: values.flightctlConfig.tpm.enabled
        ? {
            enabled: values.flightctlConfig.tpm.enabled,
            devicePath: values.flightctlConfig.tpm.devicePath || undefined,
            authEnabled: values.flightctlConfig.tpm.authEnabled || undefined,
            storageFilePath: values.flightctlConfig.tpm.storageFilePath || undefined,
          }
        : undefined,
    },
    containerRegistry: values.pushToRegistry
      ? {
          url: values.containerRegistry.url,
          credentials:
            values.containerRegistry.username || values.containerRegistry.password
              ? {
                  username: values.containerRegistry.username,
                  password: values.containerRegistry.password,
                }
              : undefined,
        }
      : undefined,
    pushToRegistry: values.pushToRegistry,
  },
});

