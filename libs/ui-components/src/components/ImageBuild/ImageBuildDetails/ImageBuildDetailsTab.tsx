import * as React from 'react';
import {
  Chip,
  ChipGroup,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
  Title,
  Progress,
} from '@patternfly/react-core';
import { ImageBuild } from '../useImageBuilds';
import { useTranslation } from '../../../hooks/useTranslation';
import ImageBuildStatus from '../ImageBuildStatus';
import { getDateDisplay } from '../../../utils/dates';

type ImageBuildDetailsTabProps = {
  imageBuild: ImageBuild;
  refetch: VoidFunction;
};

const ImageBuildDetailsTab = ({ imageBuild }: ImageBuildDetailsTabProps) => {
  const { t } = useTranslation();

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '-';
    return getDateDisplay(timestamp);
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="xl">
          {t('Build Information')}
        </Title>
      </StackItem>

      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
            <DescriptionListDescription>{imageBuild.metadata.name || '-'}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
            <DescriptionListDescription>
              <ImageBuildStatus imageBuild={imageBuild} />
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Base Image')}</DescriptionListTerm>
            <DescriptionListDescription>{imageBuild.spec.baseImage || '-'}</DescriptionListDescription>
          </DescriptionListGroup>

          {imageBuild.status?.progress !== undefined && 
           (imageBuild.status.phase === 'Building' || 
            imageBuild.status.phase === 'Pushing' || 
            imageBuild.status.phase === 'GeneratingImages') && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Progress')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Progress value={imageBuild.status.progress} title={t('Build progress')} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatTimestamp(imageBuild.metadata.creationTimestamp)}
            </DescriptionListDescription>
          </DescriptionListGroup>

          {imageBuild.status?.startTime && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Started')}</DescriptionListTerm>
              <DescriptionListDescription>{formatTimestamp(imageBuild.status.startTime)}</DescriptionListDescription>
            </DescriptionListGroup>
          )}

          {imageBuild.status?.completionTime && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Completed')}</DescriptionListTerm>
              <DescriptionListDescription>
                {formatTimestamp(imageBuild.status.completionTime)}
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}

          {(imageBuild.status?.containerImageRef || imageBuild.status?.imageUrl) && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Image URL')}</DescriptionListTerm>
              <DescriptionListDescription>
                <a href={imageBuild.status.containerImageRef || imageBuild.status.imageUrl} target="_blank" rel="noopener noreferrer">
                  {imageBuild.status.containerImageRef || imageBuild.status.imageUrl}
                </a>
                <div style={{ fontSize: 'var(--pf-v5-global--FontSize--sm)', color: 'var(--pf-v5-global--Color--200)', marginTop: '4px' }}>
                  {t('The location where the built image is available. Use this URL to pull the image.')}
                </div>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}

          {imageBuild.status?.message && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Message')}</DescriptionListTerm>
              <DescriptionListDescription>{imageBuild.status.message}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </StackItem>

      {imageBuild.spec.customizations && (
        <StackItem>
          <Title headingLevel="h3" size="lg">
            {t('Customizations')}
          </Title>
          <DescriptionList>
            {imageBuild.spec.customizations.coprRepos &&
              imageBuild.spec.customizations.coprRepos.length > 0 && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('COPR Repositories')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ChipGroup>
                      {imageBuild.spec.customizations.coprRepos.map((repo, idx) => (
                        <Chip key={idx} isReadOnly>
                          {repo}
                        </Chip>
                      ))}
                    </ChipGroup>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}

            {imageBuild.spec.customizations.packages && imageBuild.spec.customizations.packages.length > 0 && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Packages')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {imageBuild.spec.customizations.packages.join(', ')}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}

            {imageBuild.spec.customizations.files && imageBuild.spec.customizations.files.length > 0 && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Files')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {imageBuild.spec.customizations.files.map((file, idx) => (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                      <strong>{file.path}</strong>
                    </div>
                  ))}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}

            {imageBuild.spec.customizations.scripts && imageBuild.spec.customizations.scripts.length > 0 && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Scripts')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {imageBuild.spec.customizations.scripts.map((script, idx) => (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                      <strong>{script.path}</strong>
                    </div>
                  ))}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}

            {imageBuild.spec.customizations.systemdUnits &&
              imageBuild.spec.customizations.systemdUnits.length > 0 && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Systemd Units')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {imageBuild.spec.customizations.systemdUnits.map((unit, idx) => (
                      <div key={idx} style={{ marginBottom: '8px' }}>
                        <strong>{unit.name}</strong>
                        {unit.enabled !== false && (
                          <span
                            style={{
                              marginLeft: '8px',
                              fontSize: 'var(--pf-v5-global--FontSize--sm)',
                              color: 'var(--pf-v5-global--success-color--100)',
                            }}
                          >
                            ({t('enabled')})
                          </span>
                        )}
                      </div>
                    ))}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
          </DescriptionList>
        </StackItem>
      )}

      {imageBuild.spec.flightctlConfig && (
        <StackItem>
          <Title headingLevel="h3" size="lg">
            {t('FlightCtl Configuration')}
          </Title>
          <DescriptionList>
            {imageBuild.spec.flightctlConfig.enrollmentService?.service?.server && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Enrollment Server')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {imageBuild.spec.flightctlConfig.enrollmentService.service.server}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}

            {imageBuild.spec.flightctlConfig.specFetchInterval && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Spec Fetch Interval')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {imageBuild.spec.flightctlConfig.specFetchInterval}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}

            {imageBuild.spec.flightctlConfig.statusUpdateInterval && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Status Update Interval')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {imageBuild.spec.flightctlConfig.statusUpdateInterval}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}

            {imageBuild.spec.flightctlConfig.logLevel && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Log Level')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {imageBuild.spec.flightctlConfig.logLevel}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}

            {imageBuild.spec.flightctlConfig.systemInfo &&
              imageBuild.spec.flightctlConfig.systemInfo.length > 0 && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('System Info Collectors')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {imageBuild.spec.flightctlConfig.systemInfo.join(', ')}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}

            {imageBuild.spec.flightctlConfig.systemInfoCustom &&
              imageBuild.spec.flightctlConfig.systemInfoCustom.length > 0 && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Custom System Info Collectors')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {imageBuild.spec.flightctlConfig.systemInfoCustom.join(', ')}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}

            {imageBuild.spec.flightctlConfig.defaultLabels &&
              Object.keys(imageBuild.spec.flightctlConfig.defaultLabels).length > 0 && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Default Labels')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {Object.entries(imageBuild.spec.flightctlConfig.defaultLabels)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(', ')}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}

            {imageBuild.spec.flightctlConfig.tpm?.enabled && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('TPM Configuration')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {t('Enabled')}
                  {imageBuild.spec.flightctlConfig.tpm.devicePath && (
                    <div style={{ fontSize: 'var(--pf-v5-global--FontSize--sm)', marginTop: '4px' }}>
                      {t('Device Path')}: {imageBuild.spec.flightctlConfig.tpm.devicePath}
                    </div>
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
          </DescriptionList>
        </StackItem>
      )}

    </Stack>
  );
};

export default ImageBuildDetailsTab;

