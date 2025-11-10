// THIS IS DEPRECATED, USE BaseImageAndRegistryStep.tsx INSTEAD


import * as React from 'react';
import { Checkbox, FormGroup, TextInput } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';

export const containerRegistryStepId = 'container-registry-step';

export const isContainerRegistryStepValid = (errors: any, values: ImageBuildFormValues): boolean => {
  if (!values.pushToRegistry) {
    return true;
  }
  return !errors.containerRegistry;
};

const ContainerRegistryStep = () => {
  const { t } = useTranslation();
  const { values, errors, touched, handleBlur, handleChange, setFieldValue } =
    useFormikContext<ImageBuildFormValues>();

  return (
    <>
      <FormGroup fieldId="pushToRegistry">
        <Checkbox
          id="pushToRegistry"
          name="pushToRegistry"
          label={t('Push image to container registry after build')}
          isChecked={values.pushToRegistry}
          onChange={(_, checked) => setFieldValue('pushToRegistry', checked)}
        />
      </FormGroup>

      {values.pushToRegistry && (
        <>
          <FormGroup
            label={t('Registry URL')}
            isRequired
            fieldId="containerRegistry.url"
          >
            <TextInput
              id="containerRegistry.url"
              name="containerRegistry.url"
              value={values.containerRegistry.url}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={t('quay.io/myorg/myimage')}
            />
            {touched.containerRegistry?.url && errors.containerRegistry?.url && <div style={{ color: 'var(--pf-v5-global--danger-color--100)', fontSize: 'var(--pf-v5-global--FontSize--sm)' }}>{errors.containerRegistry.url}</div>}
          </FormGroup>

          <FormGroup
            label={t('Username')}
            fieldId="containerRegistry.username"
          >
            <TextInput
              id="containerRegistry.username"
              name="containerRegistry.username"
              value={values.containerRegistry.username || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={t('username')}
            />
          </FormGroup>

          <FormGroup
            label={t('Password')}
            fieldId="containerRegistry.password"
          >
            <TextInput
              id="containerRegistry.password"
              name="containerRegistry.password"
              type="password"
              value={values.containerRegistry.password || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={t('password')}
            />
          </FormGroup>
        </>
      )}
    </>
  );
};

export default ContainerRegistryStep;

