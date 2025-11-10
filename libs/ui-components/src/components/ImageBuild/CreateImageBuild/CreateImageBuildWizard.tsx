import * as React from 'react';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  PageSectionVariants,
  Title,
  Wizard,
  WizardStep,
  WizardStepType,
} from '@patternfly/react-core';
import { Formik, FormikErrors } from 'formik';

import { RESOURCE, VERB } from '../../../types/rbac';
import { useFetch } from '../../../hooks/useFetch';
import { getErrorMessage } from '../../../utils/error';
import { useTranslation } from '../../../hooks/useTranslation';
import { Link, ROUTE, useNavigate } from '../../../hooks/useNavigate';
import BaseImageAndRegistryStep, {
  baseImageAndRegistryStepId,
  isBaseImageAndRegistryStepValid,
} from './steps/BaseImageAndRegistryStep';
import CustomizationsStep, {
  customizationsStepId,
  isCustomizationsStepValid,
} from './steps/CustomizationsStep';
import SecurityStep, {
  securityStepId,
  isSecurityStepValid,
} from './steps/SecurityStep';
import BootcExportsStep, {
  bootcExportsStepId,
  isBootcExportsStepValid,
} from './steps/BootcExportsStep';
import FlightCtlConfigStep, {
  flightCtlConfigStepId,
  isFlightCtlConfigStepValid,
} from './steps/FlightCtlConfigStep';
import ReviewStep, { reviewStepId } from './steps/ReviewStep';
import { getImageBuildResource, getInitialValues, getInitialValuesFromImageBuild, getValidationSchema } from './utils';
import CreateImageBuildWizardFooter from './CreateImageBuildWizardFooter';
import { ImageBuildFormValues } from './types';
import LeaveFormConfirmation from '../../common/LeaveFormConfirmation';
import ErrorBoundary from '../../common/ErrorBoundary';
import { useAccessReview } from '../../../hooks/useAccessReview';
import PageWithPermissions from '../../common/PageWithPermissions';
import { useImageBuild } from '../ImageBuildDetails/useImageBuild';

import './CreateImageBuildWizard.css';

const orderedIds = [
  baseImageAndRegistryStepId,
  customizationsStepId,
  securityStepId,
  flightCtlConfigStepId,
  bootcExportsStepId,
  reviewStepId,
];

const getValidStepIds = (formikErrors: FormikErrors<ImageBuildFormValues>, values: ImageBuildFormValues): string[] => {
  const validStepIds: string[] = [];
  if (isBaseImageAndRegistryStepValid(formikErrors, values)) {
    validStepIds.push(baseImageAndRegistryStepId);
  }
  if (isCustomizationsStepValid(formikErrors)) {
    validStepIds.push(customizationsStepId);
  }
  if (isSecurityStepValid(formikErrors)) {
    validStepIds.push(securityStepId);
  }
  if (isFlightCtlConfigStepValid(formikErrors)) {
    validStepIds.push(flightCtlConfigStepId);
  }
  if (isBootcExportsStepValid(formikErrors)) {
    validStepIds.push(bootcExportsStepId);
  }
  // Review step is always valid. We disable it if some of the previous steps are invalid
  if (validStepIds.length === orderedIds.length - 1) {
    validStepIds.push(reviewStepId);
  }
  return validStepIds;
};

const isDisabledStep = (stepId: string | undefined, validStepIds: string[]) => {
  if (!stepId) {
    return true;
  }

  const stepIdx = orderedIds.findIndex((stepOrderId) => stepOrderId === stepId);

  return orderedIds.some((orderedId, orderedStepIdx) => {
    return orderedStepIdx < stepIdx && !validStepIds.includes(orderedId);
  });
};

type CreateImageBuildWizardProps = {
  buildId?: string;
};

const CreateImageBuildWizard = ({ buildId }: CreateImageBuildWizardProps) => {
  const { t } = useTranslation();
  const { post, put } = useFetch();
  const [error, setError] = React.useState<unknown>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState<WizardStepType>();

  const isEditMode = !!buildId;
  const [imageBuild, loadingImageBuild] = useImageBuild(buildId || '');

  const [canCreate] = useAccessReview(RESOURCE.IMAGE_BUILD, VERB.CREATE);
  const [canUpdate] = useAccessReview(RESOURCE.IMAGE_BUILD, VERB.UPDATE);

  const allowed = isEditMode ? canUpdate : canCreate;
  const loading = isEditMode ? loadingImageBuild : false;

  if (isEditMode && !loadingImageBuild && !imageBuild) {
    return (
      <PageSection>
        <Alert variant="danger" title={t('Error loading image build')} isInline>
          {t('The image build could not be found.')}
        </Alert>
      </PageSection>
    );
  }

  const initialValues = isEditMode && imageBuild
    ? getInitialValuesFromImageBuild(imageBuild)
    : getInitialValues();

  return (
    <PageWithPermissions allowed={allowed} loading={loading}>
      <PageSection variant={PageSectionVariants.light} type="breadcrumb">
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to={ROUTE.IMAGE_BUILDS}>{t('Image Builder')}</Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>
            {isEditMode ? t('Edit Image Build') : t('Create Image Build')}
          </BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1" size="3xl">
          {isEditMode ? t('Edit Image Build') : t('Create Image Build')}
        </Title>
      </PageSection>
      <PageSection>
        <ErrorBoundary>
          <Formik
            initialValues={initialValues}
            validationSchema={getValidationSchema(t)}
            validateOnMount={true}
            enableReinitialize={isEditMode}
            onSubmit={async (values) => {
              setError(undefined);
              try {
                const imageBuildResource = getImageBuildResource(values);
                if (isEditMode && buildId) {
                  await put(`imagebuilds/${buildId}`, imageBuildResource);
                } else {
                  await post('imagebuilds', imageBuildResource);
                }
                navigate(ROUTE.IMAGE_BUILDS);
              } catch (err) {
                setError(err);
              }
            }}
          >
            {({ errors: formikErrors, values }) => {
              const validStepIds = getValidStepIds(formikErrors, values);

              return (
                <>
                  <LeaveFormConfirmation />
                  <Wizard
                    footer={<CreateImageBuildWizardFooter />}
                    onStepChange={(_, step) => {
                      if (error) {
                        setError(undefined);
                      }
                      setCurrentStep(step);
                    }}
                    className="fctl-create-image-build"
                  >
                    <WizardStep name={t('Base Image & Registry')} id={baseImageAndRegistryStepId}>
                      {(!currentStep || currentStep?.id === baseImageAndRegistryStepId) && <BaseImageAndRegistryStep />}
                    </WizardStep>
                    <WizardStep
                      name={t('Customizations')}
                      id={customizationsStepId}
                      isDisabled={isDisabledStep(customizationsStepId, validStepIds)}
                    >
                      {currentStep?.id === customizationsStepId && <CustomizationsStep />}
                    </WizardStep>
                    <WizardStep
                      name={t('Security')}
                      id={securityStepId}
                      isDisabled={isDisabledStep(securityStepId, validStepIds)}
                    >
                      {currentStep?.id === securityStepId && <SecurityStep />}
                    </WizardStep>
                    <WizardStep
                      name={t('FlightCtl Config')}
                      id={flightCtlConfigStepId}
                      isDisabled={isDisabledStep(flightCtlConfigStepId, validStepIds)}
                    >
                      {currentStep?.id === flightCtlConfigStepId && <FlightCtlConfigStep />}
                    </WizardStep>
                    <WizardStep
                      name={t('Bootc Exports')}
                      id={bootcExportsStepId}
                      isDisabled={isDisabledStep(bootcExportsStepId, validStepIds)}
                    >
                      {currentStep?.id === bootcExportsStepId && <BootcExportsStep />}
                    </WizardStep>
                    <WizardStep
                      name={t('Review')}
                      id={reviewStepId}
                      isDisabled={isDisabledStep(reviewStepId, validStepIds)}
                    >
                      {currentStep?.id === reviewStepId && <ReviewStep error={error} />}
                    </WizardStep>
                  </Wizard>
                </>
              );
            }}
          </Formik>
        </ErrorBoundary>
      </PageSection>
    </PageWithPermissions>
  );
};

export default CreateImageBuildWizard;

