import * as React from 'react';
import {
  ActionGroup,
  Alert,
  AlertActionCloseButton,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  PageSection,
  PageSectionVariants,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';

import { useTranslation } from '../../../hooks/useTranslation';
import { useFetch } from '../../../hooks/useFetch';
import { getErrorMessage } from '../../../utils/error';
import { Link, ROUTE, useNavigate } from '../../../hooks/useNavigate';
import { CodeEditor, Language } from '@patternfly/react-code-editor';
import { RESOURCE, VERB } from '../../../types/rbac';
import { useAccessReview } from '../../../hooks/useAccessReview';
import PageWithPermissions from '../../common/PageWithPermissions';
import ErrorBoundary from '../../common/ErrorBoundary';
import { ImageBuild } from '../useImageBuilds';
import { useThemePreferences } from '../../../hooks/useThemePreferences';
import { defineConsoleThemes } from '../../common/CodeEditor/CodeEditorTheme';
import '../../common/CodeEditor/YamlEditor.css';

type Monaco = typeof monacoEditor;

const defaultContainerfile = `FROM quay.io/fedora/fedora:latest

# Install packages
# RUN dnf install -y <package-name>

# Copy custom files
# COPY <<EOF /path/to/file
# file content here
# EOF

# Custom scripts
# RUN cat > /path/to/script.sh <<'SCRIPT_EOF'
# #!/bin/bash
# echo "Hello from script"
# SCRIPT_EOF
# RUN chmod +x /path/to/script.sh

# SSH keys
# RUN mkdir -p /root/.ssh
# RUN echo "ssh-rsa AAAAB3..." >> /root/.ssh/authorized_keys
# RUN chmod 700 /root/.ssh && chmod 600 /root/.ssh/authorized_keys

# Create users
# RUN useradd -m -s /bin/bash username
# RUN echo "username:password" | chpasswd

# Install Flightctl agent
RUN dnf -y config-manager --add-repo https://rpm.flightctl.io/flightctl-epel.repo && \\
    dnf -y install flightctl-agent && \\
    dnf -y clean all && \\
    systemctl enable flightctl-agent.service

# Add Flightctl configuration
ADD config.yaml /etc/flightctl/
`;

const CreateImageBuildContainerfile = () => {
  const { t } = useTranslation();
  const { post } = useFetch();
  const navigate = useNavigate();
  const { resolvedTheme } = useThemePreferences();
  const editorRef = React.useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = React.useRef<Monaco | null>(null);
  const [editorMounted, setEditorMounted] = React.useState(false);
  const [containerfile, setContainerfile] = React.useState<string>(defaultContainerfile);
  const [buildName, setBuildName] = React.useState<string>('');
  const [baseImage, setBaseImage] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [saveError, setSaveError] = React.useState<string | undefined>(undefined);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = React.useState<boolean>(false);

  const [canCreate] = useAccessReview(RESOURCE.IMAGE_BUILD, VERB.CREATE);

  // Extract base image from Containerfile if not manually set
  React.useEffect(() => {
    if (!baseImage && containerfile) {
      const fromMatch = containerfile.match(/^FROM\s+(.+?)(?:\s|$)/m);
      if (fromMatch && fromMatch[1]) {
        setBaseImage(fromMatch[1].trim());
      }
    }
  }, [containerfile, baseImage]);

  const handleSave = async () => {
    if (!buildName.trim()) {
      setSaveError(t('Name is required'));
      return;
    }

    if (!baseImage.trim()) {
      setSaveError(t('Base image is required'));
      return;
    }

    if (!containerfile.trim()) {
      setSaveError(t('Containerfile content is required'));
      return;
    }

    setSaveError(undefined);
    setIsSavedSuccessfully(false);
    setIsSaving(true);

    try {
      const imageBuild: ImageBuild = {
        apiVersion: 'flightctl.io/v1alpha1',
        kind: 'ImageBuild',
        metadata: {
          name: buildName.trim(),
        },
        spec: {
          baseImage: baseImage.trim(),
          containerfile: containerfile.trim(),
        },
      };

      await post('imagebuilds', imageBuild);
      setIsSavedSuccessfully(true);
      setTimeout(() => {
        navigate(ROUTE.IMAGE_BUILDS);
      }, 1500);
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageWithPermissions allowed={canCreate} loading={false}>
      <PageSection variant={PageSectionVariants.light} type="breadcrumb">
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to={ROUTE.IMAGE_BUILDS}>{t('Image Builder')}</Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{t('Create Image Build from Containerfile')}</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1" size="3xl">
          {t('Create Image Build from Containerfile')}
        </Title>
      </PageSection>
      <PageSection>
        <Stack hasGutter>
          {isSavedSuccessfully && (
            <StackItem>
              <Alert
                isInline
                variant="success"
                title={t('Image build created successfully')}
                actionClose={<AlertActionCloseButton onClose={() => setIsSavedSuccessfully(false)} />}
              >
                {t('Redirecting to image builds list...')}
              </Alert>
            </StackItem>
          )}

          {saveError && (
            <StackItem>
              <Alert isInline variant="danger" title={t('Error creating image build')}>
                {saveError}
              </Alert>
            </StackItem>
          )}

          <StackItem>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="build-name" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                {t('Build Name')} <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                id="build-name"
                type="text"
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                placeholder={t('my-image-build')}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="base-image" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                {t('Base Image')} <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                id="base-image"
                type="text"
                value={baseImage}
                onChange={(e) => setBaseImage(e.target.value)}
                placeholder={t('quay.io/fedora/fedora:latest')}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
              <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '4px' }}>
                {t('Base image will be auto-detected from Containerfile if not specified')}
              </div>
            </div>
          </StackItem>

          <StackItem>
            <ErrorBoundary>
              <div className="fctl-yaml-editor">
                <CodeEditor
                  code={containerfile}
                  language={Language.dockerfile}
                  onChange={(value) => setContainerfile(value || '')}
                  isCopyEnabled
                  isDownloadEnabled
                  downloadFileName="Containerfile"
                  onEditorDidMount={(editor: monacoEditor.editor.IStandaloneCodeEditor, instance: Monaco) => {
                    setEditorMounted(true);
                    defineConsoleThemes(instance);
                    monacoRef.current = instance;
                    editorRef.current = editor;
                    // Force layout to ensure proper height
                    setTimeout(() => {
                      editor.layout();
                    }, 100);
                  }}
                  options={{
                    theme: `console-${resolvedTheme}`,
                    automaticLayout: true,
                  }}
                />
              </div>
              <ActionGroup style={{ marginTop: '16px' }}>
                <Button variant="primary" onClick={handleSave} isDisabled={isSaving}>
                  {isSaving ? t('Creating...') : t('Create Image Build')}
                </Button>
                <Button variant="secondary" onClick={() => navigate(ROUTE.IMAGE_BUILDS)}>
                  {t('Cancel')}
                </Button>
              </ActionGroup>
            </ErrorBoundary>
          </StackItem>
        </Stack>
      </PageSection>
    </PageWithPermissions>
  );
};

export default CreateImageBuildContainerfile;

