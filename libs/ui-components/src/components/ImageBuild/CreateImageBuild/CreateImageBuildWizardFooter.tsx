import * as React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button, WizardFooterWrapper, useWizardContext } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { ImageBuildFormValues } from './types';
import { useNavigate } from '../../../hooks/useNavigate';
import { reviewStepId } from './steps/ReviewStep';
import { baseImageAndRegistryStepId, isBaseImageAndRegistryStepValid } from './steps/BaseImageAndRegistryStep';
import { customizationsStepId, isCustomizationsStepValid } from './steps/CustomizationsStep';
import { flightCtlConfigStepId, isFlightCtlConfigStepValid } from './steps/FlightCtlConfigStep';

const CreateImageBuildWizardFooter = () => {
  const { t } = useTranslation();
  const { goToNextStep, goToPrevStep, activeStep } = useWizardContext();
  const { submitForm, isSubmitting, errors, values } = useFormikContext<ImageBuildFormValues>();
  const navigate = useNavigate();
  const buttonRef = React.useRef<HTMLButtonElement>();

  const isReviewStep = activeStep.id === reviewStepId;
  let isStepValid = true;
  if (activeStep.id === baseImageAndRegistryStepId) {
    isStepValid = isBaseImageAndRegistryStepValid(errors, values);
  } else if (activeStep.id === customizationsStepId) {
    isStepValid = isCustomizationsStepValid(errors);
  } else if (activeStep.id === flightCtlConfigStepId) {
    isStepValid = isFlightCtlConfigStepValid(errors);
  }

  const onMoveNext = () => {
    goToNextStep();
    buttonRef.current?.blur();
  };

  let primaryBtn: React.ReactNode;

  if (isReviewStep) {
    primaryBtn = (
      <Button variant="primary" onClick={submitForm} isDisabled={isSubmitting} isLoading={isSubmitting}>
        {t('Create build')}
      </Button>
    );
  } else {
    primaryBtn = (
      <Button variant="primary" onClick={onMoveNext} isDisabled={!isStepValid} ref={buttonRef}>
        {t('Next')}
      </Button>
    );
  }

  return (
    <WizardFooterWrapper>
      {primaryBtn}
      {activeStep.id !== baseImageAndRegistryStepId && (
        <Button variant="secondary" onClick={goToPrevStep} isDisabled={isSubmitting}>
          {t('Back')}
        </Button>
      )}
      <Button variant="link" onClick={() => navigate(-1)} isDisabled={isSubmitting}>
        {t('Cancel')}
      </Button>
    </WizardFooterWrapper>
  );
};

export default CreateImageBuildWizardFooter;

