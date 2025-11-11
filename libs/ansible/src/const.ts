import { ROUTE } from '@flightctl/ui-components/src/hooks/useNavigate';

export const appRoutes = {
  [ROUTE.ROOT]: '/edge/overview',
  [ROUTE.FLEETS]: '/edge/fleets',
  [ROUTE.FLEET_DETAILS]: '/edge/fleets',
  [ROUTE.FLEET_CREATE]: '/edge/fleets/create',
  [ROUTE.FLEET_EDIT]: '/edge/fleets/edit',
  [ROUTE.FLEET_IMPORT]: '/edge/fleets/import',
  [ROUTE.DEVICES]: '/edge/devices',
  [ROUTE.DEVICE_DETAILS]: '/edge/devices',
  [ROUTE.DEVICE_EDIT]: '/edge/devices/edit',
  [ROUTE.REPO_CREATE]: '/edge/repositories/create',
  [ROUTE.REPO_EDIT]: '/edge/repositories/edit',
  [ROUTE.REPO_DETAILS]: '/edge/repositories',
  [ROUTE.REPOSITORIES]: '/edge/repositories',
  [ROUTE.RESOURCE_SYNC_DETAILS]: '/edge/resourcesyncs',
  [ROUTE.ENROLLMENT_REQUESTS]: '/edge/enrollmentrequests',
  [ROUTE.ENROLLMENT_REQUEST_DETAILS]: '/edge/enrollmentrequests',
  [ROUTE.COMMAND_LINE_TOOLS]: '/', // TODO - TBD where to show the CLI downloads?
  [ROUTE.IMAGE_BUILDS]: '/edge/imagebuilds',
  [ROUTE.IMAGE_BUILD_CREATE]: '/edge/imagebuilds/create',
  [ROUTE.IMAGE_BUILD_CREATE_YAML]: '/edge/imagebuilds/create-yaml',
  [ROUTE.IMAGE_BUILD_CREATE_CONTAINERFILE]: '/edge/imagebuilds/create-containerfile',
  [ROUTE.IMAGE_BUILD_DETAILS]: '/edge/imagebuilds',
  [ROUTE.IMAGE_BUILD_EDIT]: '/edge/imagebuilds',
};
