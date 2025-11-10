// THIS IS DEPRECATED, USE BaseImageAndRegistryStep.tsx INSTEAD

import * as React from 'react';
import {
  Checkbox,
  FormGroup,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  TextInput,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';

export const baseImageStepId = 'base-image-step';

export const isBaseImageStepValid = (errors: any): boolean => {
  return !errors.name && !errors.baseImage;
};

const SUGGESTED_BASE_IMAGES = [
  {
    value: 'quay.io/centos-bootc/centos-bootc:stream9',
    label: 'CentOS Stream 9',
    description: 'quay.io/centos-bootc/centos-bootc:stream9',
  },
  {
    value: 'quay.io/fedora/fedora-bootc:42',
    label: 'Fedora',
    description: 'quay.io/fedora/fedora-bootc:42',
  },
  {
    value: 'quay.io/centos-bootc/centos-bootc:stream10',
    label: 'CentOS Stream 10 (in development)',
    description: 'quay.io/centos-bootc/centos-bootc:stream10',
  },
];

const BaseImageStep = () => {
  const { t } = useTranslation();
  const { values, errors, touched, handleBlur, handleChange, setFieldValue } =
    useFormikContext<ImageBuildFormValues>();
  const [isBaseImageSelectOpen, setIsBaseImageSelectOpen] = React.useState(false);
  const [isCustomImage, setIsCustomImage] = React.useState(false);

  // Check if current value is one of the suggested images
  React.useEffect(() => {
    const isSuggested = SUGGESTED_BASE_IMAGES.some((img) => img.value === values.baseImage);
    setIsCustomImage(!isSuggested && values.baseImage !== '');
  }, [values.baseImage]);

  const handleBaseImageSelect = (value: string | undefined) => {
    if (value === 'custom') {
      setIsCustomImage(true);
      setFieldValue('baseImage', '');
    } else if (value) {
      setIsCustomImage(false);
      setFieldValue('baseImage', value);
    }
    setIsBaseImageSelectOpen(false);
  };

  const selectedBaseImageLabel = isCustomImage
    ? t('Custom image')
    : SUGGESTED_BASE_IMAGES.find((img) => img.value === values.baseImage)?.label || t('Select base image');

  return (
    <>
      <FormGroup
        label={t('Build name')}
        isRequired
        fieldId="name"
      >
        <TextInput
          id="name"
          name="name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={t('my-custom-image')}
        />
        {touched.name && errors.name && (
          <div style={{ color: 'var(--pf-v5-global--danger-color--100)', fontSize: 'var(--pf-v5-global--FontSize--sm)' }}>
            {errors.name}
          </div>
        )}
      </FormGroup>

      <FormGroup
        label={t('Base image')}
        isRequired
        fieldId="baseImage"
      >
        <Select
          id="baseImage-select"
          isOpen={isBaseImageSelectOpen}
          selected={isCustomImage ? 'custom' : values.baseImage}
          onSelect={(_, value) => handleBaseImageSelect(value as string)}
          onOpenChange={(isOpen) => setIsBaseImageSelectOpen(isOpen)}
          toggle={(toggleRef) => (
            <MenuToggle
              ref={toggleRef}
              onClick={() => setIsBaseImageSelectOpen(!isBaseImageSelectOpen)}
              isExpanded={isBaseImageSelectOpen}
              isFullWidth
            >
              {selectedBaseImageLabel}
            </MenuToggle>
          )}
        >
          <SelectList>
            {SUGGESTED_BASE_IMAGES.map((image) => (
              <SelectOption key={image.value} value={image.value} description={image.description}>
                {image.label}
              </SelectOption>
            ))}
            <SelectOption key="custom" value="custom">
              {t('Custom image')}
            </SelectOption>
          </SelectList>
        </Select>
        {isCustomImage && (
          <TextInput
            id="baseImage"
            name="baseImage"
            value={values.baseImage}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('quay.io/fedora/fedora:latest')}
            style={{ marginTop: '8px' }}
          />
        )}
        {touched.baseImage && errors.baseImage && (
          <div style={{ color: 'var(--pf-v5-global--danger-color--100)', fontSize: 'var(--pf-v5-global--FontSize--sm)' }}>
            {errors.baseImage}
          </div>
        )}
      </FormGroup>

      <FormGroup
        label={t('Registry credentials (optional)')}
        fieldId="baseImageRegistryCredentials"
      >
        <FormGroup label={t('Username')} fieldId="registryUsername">
          <TextInput
            id="registryUsername"
            name="baseImageRegistryCredentials.username"
            value={values.baseImageRegistryCredentials?.username || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('Registry username')}
          />
        </FormGroup>
        <FormGroup label={t('Password')} fieldId="registryPassword">
          <TextInput
            id="registryPassword"
            name="baseImageRegistryCredentials.password"
            type="password"
            value={values.baseImageRegistryCredentials?.password || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('Registry password')}
          />
        </FormGroup>
        <Checkbox
          id="skipTLSVerify"
          label={t('Skip TLS verification')}
          isChecked={values.baseImageRegistryCredentials?.skipTLSVerify || false}
          onChange={(_, checked) => setFieldValue('baseImageRegistryCredentials.skipTLSVerify', checked)}
        />
      </FormGroup>
    </>
  );
};

export default BaseImageStep;

