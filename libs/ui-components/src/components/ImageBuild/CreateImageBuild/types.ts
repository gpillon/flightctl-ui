export type ImageBuildFormValues = {
  name: string;
  baseImage: string;
  baseImageRegistryCredentials?: {
    username?: string;
    password?: string;
    skipTLSVerify?: boolean;
  };
  customizations: {
    packages: string[];
    coprRepos: string[]; // COPR repository names (e.g., "user/repo")
    enableEpel?: boolean;
    enablePodman?: boolean;
    files: Array<{
      path: string;
      content: string;
      mode?: string;
      user?: string;
      group?: string;
    }>;
    scripts: Array<{
      path: string;
      content: string;
    }>;
    systemdUnits: Array<{
      name: string;
      content: string;
      enabled?: boolean;
    }>;
    sshKeys?: string[];
    users?: Array<{
      name: string;
      password?: string;
      groups?: string[];
      sshKeys?: string[];
      shell?: string;
    }>;
  };
  bootcExports?: Array<{
    type: 'iso' | 'ami' | 'vmdk' | 'qcow2' | 'raw' | 'tar';
    architecture?: 'x86_64' | 'aarch64';
  }>;
  flightctlConfig: {
    overrideEnrollmentService: boolean;
    enrollmentService: {
      server: string;
      certificateAuthorityData: string;
      clientCertificateData: string;
      clientKeyData: string;
      enrollmentUiEndpoint: string;
    };
    specFetchInterval: string;
    statusUpdateInterval: string;
    defaultLabels: Record<string, string>;
    systemInfo: string[];
    systemInfoCustom: string[];
    systemInfoTimeout: string;
    pullTimeout: string;
    logLevel: string;
    tpm: {
      enabled: boolean;
      devicePath: string;
      authEnabled: boolean;
      storageFilePath: string;
    };
  };
  containerRegistry: {
    url: string;
    username?: string;
    password?: string;
  };
  pushToRegistry: boolean;
};

