import * as React from 'react';
import {
  Alert,
  ClipboardCopy,
  ClipboardCopyVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  List,
  ListItem,
  Stack,
  StackItem,
  Title,
  Button,
} from '@patternfly/react-core';
import { DownloadIcon } from '@patternfly/react-icons/dist/js/icons/download-icon';
import { ImageBuild } from '../useImageBuilds';
import { useTranslation } from '../../../hooks/useTranslation';

type ImageBuildDownloadTabProps = {
  imageBuild: ImageBuild;
};

const ImageBuildDownloadTab = ({ imageBuild }: ImageBuildDownloadTabProps) => {
  const { t } = useTranslation();

  const isCompleted = imageBuild.status?.phase === 'Completed';
  // Use containerImageRef from API (real backend) or fall back to imageUrl (mock)
  const imageUrl = imageBuild.status?.containerImageRef || imageBuild.status?.imageUrl;

  const podmanPullCommand = imageUrl ? `podman pull ${imageUrl}` : '';
  const podmanRunCommand = imageUrl ? `podman run -it ${imageUrl}` : '';

  // Get API base URL from window for absolute download URLs
  const getApiBaseUrl = () => {
    const apiPort = (window as any).API_PORT || window.location.port;
    const apiServer = `${window.location.hostname}${apiPort ? `:${apiPort}` : ''}`;
    return `${window.location.protocol}//${apiServer}`;
  };

  const handleDownload = (url: string, filename: string) => {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isCompleted) {
    return (
      <Stack hasGutter>
        <StackItem>
          <Alert variant="info" title={t('Build not completed')} isInline>
            {t('The image will be available for download once the build is completed.')}
          </Alert>
        </StackItem>
      </Stack>
    );
  }

  return (
    <Stack hasGutter>
      {/* Container Image Section */}
      <StackItem>
        <Title headingLevel="h2" size="xl">
          {t('Container Image')}
        </Title>
      </StackItem>

      {imageUrl ? (
        <>
          <StackItem>
            <Alert variant="success" title={t('Image available')} isInline>
              {t('The container image has been built successfully and is ready to use.')}
            </Alert>
          </StackItem>

          <StackItem>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Image URL')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <ClipboardCopy
                    hoverTip={t('Copy')}
                    clickTip={t('Copied')}
                    variant={ClipboardCopyVariant.expansion}
                  >
                    {imageUrl}
                  </ClipboardCopy>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </StackItem>

          <StackItem>
            <Title headingLevel="h3" size="lg">
              {t('Using with Podman')}
            </Title>
          </StackItem>

          <StackItem>
            <p>{t('Pull the image:')}</p>
            <ClipboardCopy
              hoverTip={t('Copy')}
              clickTip={t('Copied')}
              variant={ClipboardCopyVariant.expansion}
            >
              {podmanPullCommand}
            </ClipboardCopy>
          </StackItem>

          <StackItem>
            <p>{t('Run the image:')}</p>
            <ClipboardCopy
              hoverTip={t('Copy')}
              clickTip={t('Copied')}
              variant={ClipboardCopyVariant.expansion}
            >
              {podmanRunCommand}
            </ClipboardCopy>
          </StackItem>

          <StackItem>
            <Title headingLevel="h3" size="lg">
              {t('Using with Docker')}
            </Title>
          </StackItem>

          <StackItem>
            <p>{t('Docker commands (replace podman with docker):')}</p>
            <List>
              <ListItem>
                <code>docker pull {imageUrl}</code>
              </ListItem>
              <ListItem>
                <code>docker run -it {imageUrl}</code>
              </ListItem>
            </List>
          </StackItem>
        </>
      ) : (
        <StackItem>
          <Alert variant="warning" title={t('Image URL not available')} isInline>
            {t('The image was built but the URL is not available. Please check with your administrator.')}
          </Alert>
        </StackItem>
      )}

      {/* Bootc Exports Section */}
      {imageBuild.spec.bootcExports && imageBuild.spec.bootcExports.length > 0 && (
        <>
          <StackItem style={{ marginTop: '32px' }}>
            <Title headingLevel="h2" size="xl">
              {t('Bootc Export Formats')}
            </Title>
          </StackItem>

          <StackItem>
            <Alert variant="info" title={t('Additional formats')} isInline>
              {t('This image has been exported to additional formats.')}
            </Alert>
          </StackItem>

          <StackItem>
            <DescriptionList isHorizontal>
              {imageBuild.spec.bootcExports.map((bootcExport, index) => {
                const exportType = bootcExport.type.toUpperCase();
                const architecture = bootcExport.architecture || 'x86_64';
                const fileName = `${imageBuild.metadata.name}-${bootcExport.type}-${architecture}`;
                const downloadUrl = imageBuild.status?.downloadUrl
                  ? `${imageBuild.status.downloadUrl}/${fileName}`
                  : `${getApiBaseUrl()}/api/builder/v1/imagebuilds/${imageBuild.metadata.name}/downloads/${fileName}`;

                return (
                  <DescriptionListGroup key={index}>
                    <DescriptionListTerm>
                      {exportType} ({architecture})
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                      <Stack>
                        <StackItem>
                          {bootcExport.type === 'iso' && t('Bootable ISO image for installation')}
                          {bootcExport.type === 'ami' && t('Amazon Machine Image for AWS EC2')}
                          {bootcExport.type === 'vmdk' && t('VMware virtual disk image')}
                          {bootcExport.type === 'qcow2' && t('QEMU/KVM disk image')}
                          {bootcExport.type === 'raw' && t('Raw disk image')}
                          {bootcExport.type === 'tar' && t('TAR archive')}
                        </StackItem>
                        <StackItem>
                          <Button
                            variant="primary"
                            icon={<DownloadIcon />}
                            onClick={() => handleDownload(downloadUrl, fileName)}
                          >
                            {t('Download {{type}}', { type: exportType })}
                          </Button>
                        </StackItem>
                      </Stack>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                );
              })}
            </DescriptionList>
          </StackItem>

          {/* <StackItem style={{ marginTop: '16px' }}>
            <Alert variant="info" title={t('Note')} isInline>
              {t('Downloaded files are served from the backend storage volumes. Ensure you have the necessary permissions to access them.')}
            </Alert>
          </StackItem> */}
        </>
      )}

      {/* No exports available */}
      {(!imageBuild.spec.bootcExports || imageBuild.spec.bootcExports.length === 0) && (
        <StackItem style={{ marginTop: '32px' }}>
          <Alert variant="info" title={t('No additional formats')} isInline>
            {t('This build only produces a container image. To create additional formats (ISO, VMDK, etc.), configure bootc exports when creating the build.')}
          </Alert>
        </StackItem>
      )}
    </Stack>
  );
};

export default ImageBuildDownloadTab;

