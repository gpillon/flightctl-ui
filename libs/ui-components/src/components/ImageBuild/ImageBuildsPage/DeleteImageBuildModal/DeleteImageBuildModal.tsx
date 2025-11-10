import * as React from 'react';
import { Alert, Button, Stack, StackItem } from '@patternfly/react-core';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core/next';

import { useTranslation } from '../../../../hooks/useTranslation';
import { useFetch } from '../../../../hooks/useFetch';
import { getErrorMessage } from '../../../../utils/error';

const DeleteImageBuildModal = ({
  buildId,
  onClose,
}: {
  buildId: string;
  onClose: (hasDeleted?: boolean) => void;
}) => {
  const { t } = useTranslation();
  const { remove } = useFetch();

  const [error, setError] = React.useState<{ text: string; details?: string }>();
  const [isDeleting, setIsDeleting] = React.useState<boolean>();

  const onDelete = async () => {
    try {
      await remove(`imagebuilds/${buildId}`);
    } catch (buildErr) {
      setError({ text: t('Deletion of image build {{buildId}} failed.'), details: getErrorMessage(buildErr) });
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => {
        onClose();
      }}
      variant="small"
    >
      <ModalHeader title={t('Delete image build?')} titleIconVariant="warning" />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            <strong>{buildId}</strong> {t('will be deleted permanently.')}
          </StackItem>
          <StackItem>{t('Are you sure you want to delete?')}</StackItem>
          {error && (
            <StackItem>
              <Alert isInline variant="danger" title={t('An error occurred')}>
                <div>{error.text}</div>
                {error.details && <div>{t('Details: {{errorDetails}}', { errorDetails: error.details })}</div>}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          key="confirm"
          variant="danger"
          isDisabled={isDeleting || !!error}
          isLoading={isDeleting}
          onClick={async () => {
            setError(undefined);
            try {
              setIsDeleting(true);
              await onDelete();
              setIsDeleting(false);
              onClose(true);
            } catch {
              setIsDeleting(false);
            }
          }}
        >
          {t('Delete build')}
        </Button>
        <Button
          key="cancel"
          variant="link"
          onClick={() => {
            onClose();
          }}
          isDisabled={isDeleting}
        >
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteImageBuildModal;

