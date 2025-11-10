import * as React from 'react';
import { useDebounce } from 'use-debounce';

import { ListMeta } from '@flightctl/types';
import { useFetchPeriodically } from '../../hooks/useFetchPeriodically';
import { PaginationDetails, useTablePagination } from '../../hooks/useTablePagination';
import { PAGE_SIZE } from '../../constants';
import { useAppContext } from '../../hooks/useAppContext';

// Temporary type definitions - these should be generated from OpenAPI in the future
export enum ImageBuildStatus {
  PENDING = 'Pending',
  BUILDING = 'Building',
  PUSHING = 'Pushing',
  GENERATING_IMAGES = 'GeneratingImages',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
  CANCELLED = 'Cancelled',
  // Legacy alias for backward compatibility
  QUEUED = 'Queued',
}

export type ImageBuild = {
  apiVersion: string;
  kind: string;
  metadata: {
    name?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
  };
  spec: {
    baseImage: string;
    containerfile?: string;
    baseImageRegistryCredentials?: {
      username?: string;
      password?: string;
      skipTLSVerify?: boolean;
    };
    customizations?: {
      packages?: string[];
      coprRepos?: string[];
      enableEpel?: boolean;
      enablePodman?: boolean;
      files?: Array<{
        path: string;
        content: string;
        mode?: string;
        user?: string;
        group?: string;
      }>;
      scripts?: Array<{
        path: string;
        content: string;
      }>;
      systemdUnits?: Array<{
        name: string;
        enabled?: boolean;
        content: string;
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
    flightctlConfig?: {
      enrollmentService?: {
        service?: {
          server?: string;
          certificateAuthorityData?: string;
        };
        authentication?: {
          clientCertificateData?: string;
          clientKeyData?: string;
        };
        enrollmentUiEndpoint?: string;
      };
      specFetchInterval?: string;
      statusUpdateInterval?: string;
      defaultLabels?: Record<string, string>;
      systemInfo?: string[];
      systemInfoCustom?: string[];
      systemInfoTimeout?: string;
      pullTimeout?: string;
      logLevel?: string;
      tpm?: {
        enabled?: boolean;
        devicePath?: string;
        authEnabled?: boolean;
        storageFilePath?: string;
      };
    };
    containerRegistry?: {
      url: string;
      credentials?: {
        username?: string;
        password?: string;
      };
    };
    pushToRegistry?: boolean;
  };
  status?: {
    phase: ImageBuildStatus;
    message?: string;
    startTime?: string;
    completionTime?: string;
    containerImageRef?: string; // API field for the built image reference
    imageUrl?: string; // Legacy field from mock - fallback for backward compatibility
    downloadUrl?: string;
    logs?: string[];
    progress?: number;
  };
};

export type ImageBuildList = {
  apiVersion: string;
  kind: string;
  metadata: ListMeta;
  items: ImageBuild[];
};

export enum ImageBuildSearchParams {
  Name = 'name',
  Status = 'status',
}

type ImageBuildsEndpointArgs = {
  name?: string;
  status?: ImageBuildStatus;
  nextContinue?: string;
};

export const useImageBuildBackendFilters = () => {
  const {
    router: { useSearchParams },
  } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsRef = React.useRef(searchParams);
  const name = searchParams.get(ImageBuildSearchParams.Name) || undefined;
  const status = (searchParams.get(ImageBuildSearchParams.Status) as ImageBuildStatus) || undefined;

  const setName = React.useCallback(
    (nameVal: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (nameVal) {
        newParams.set(ImageBuildSearchParams.Name, nameVal);
      } else {
        newParams.delete(ImageBuildSearchParams.Name);
      }
      paramsRef.current = newParams;
      setSearchParams(newParams);
    },
    [setSearchParams, searchParams],
  );

  const setStatus = React.useCallback(
    (statusVal: ImageBuildStatus | undefined) => {
      const newParams = new URLSearchParams(searchParams);
      if (statusVal) {
        newParams.set(ImageBuildSearchParams.Status, statusVal);
      } else {
        newParams.delete(ImageBuildSearchParams.Status);
      }
      paramsRef.current = newParams;
      setSearchParams(newParams);
    },
    [setSearchParams, searchParams],
  );

  const hasFiltersEnabled = !!name || !!status;

  return {
    name,
    setName,
    status,
    setStatus,
    hasFiltersEnabled,
  };
};

const getImageBuildsEndpoint = ({
  name,
  status,
  nextContinue,
}: ImageBuildsEndpointArgs) => {
  const params = new URLSearchParams({
    limit: `${PAGE_SIZE}`,
  });
  if (name) {
    params.set('fieldSelector', `metadata.name contains ${name}`);
  }
  if (status) {
    params.set('fieldSelector', `${params.get('fieldSelector') || ''} status.phase=${status}`.trim());
  }
  if (nextContinue) {
    params.set('continue', nextContinue);
  }
  return `imagebuilds?${params.toString()}`;
};

const useImageBuildsEndpoint = (args: ImageBuildsEndpointArgs): [string, boolean] => {
  const endpoint = getImageBuildsEndpoint(args);
  const [imageBuildsEndpointDebounced] = useDebounce(endpoint, 1000);
  return [imageBuildsEndpointDebounced, endpoint !== imageBuildsEndpointDebounced];
};

export type ImageBuildLoad = {
  imageBuilds: ImageBuild[];
  isLoading: boolean;
  error: unknown;
  isUpdating: boolean;
  refetch: VoidFunction;
  pagination: PaginationDetails<ImageBuildList>;
};

export const useImageBuilds = (args: ImageBuildsEndpointArgs): ImageBuildLoad => {
  const pagination = useTablePagination<ImageBuildList>();
  const [imageBuildsEndpoint, imageBuildsDebouncing] = useImageBuildsEndpoint({
    ...args,
    nextContinue: pagination.nextContinue,
  });
  const [imageBuildsList, isLoading, error, refetch, updating] = useFetchPeriodically<ImageBuildList>(
    {
      endpoint: imageBuildsEndpoint,
    },
    pagination.onPageFetched,
  );
  return {
    imageBuilds: imageBuildsList?.items || [],
    isLoading,
    error,
    isUpdating: updating || imageBuildsDebouncing,
    refetch,
    pagination,
  };
};

