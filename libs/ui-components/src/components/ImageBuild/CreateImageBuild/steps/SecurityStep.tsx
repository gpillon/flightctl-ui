import * as React from 'react';
import {
    Button,
    FormGroup,
    TextArea,
    Stack,
    StackItem,
    Title,
    FormSection,
} from '@patternfly/react-core';
import { PlusCircleIcon, TrashIcon } from '@patternfly/react-icons';
import { useFormikContext } from 'formik';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';

export const securityStepId = 'security-step';

export const isSecurityStepValid = (errors: any): boolean => {
    return !errors.customizations?.sshKeys && !errors.customizations?.users;
};

const SecurityStep = () => {
    const { t } = useTranslation();
    const { values, setFieldValue } = useFormikContext<ImageBuildFormValues>();

    const addSshKey = () => {
        const currentKeys = values.customizations.sshKeys || [];
        setFieldValue('customizations.sshKeys', [...currentKeys, '']);
    };

    const removeSshKey = (index: number) => {
        const currentKeys = values.customizations.sshKeys || [];
        const newKeys = currentKeys.filter((_, i) => i !== index);
        setFieldValue('customizations.sshKeys', newKeys);
    };

    const updateSshKey = (index: number, value: string) => {
        const currentKeys = values.customizations.sshKeys || [];
        const newKeys = [...currentKeys];
        newKeys[index] = value;
        setFieldValue('customizations.sshKeys', newKeys);
    };

    const addUser = () => {
        const currentUsers = values.customizations.users || [];
        setFieldValue('customizations.users', [
            ...currentUsers,
            {
                name: '',
                password: '',
                groups: [],
                sshKeys: [],
                shell: '/bin/bash',
            },
        ]);
    };

    const removeUser = (index: number) => {
        const currentUsers = values.customizations.users || [];
        const newUsers = currentUsers.filter((_, i) => i !== index);
        setFieldValue('customizations.users', newUsers);
    };

    const updateUser = (index: number, field: string, value: any) => {
        const currentUsers = values.customizations.users || [];
        const newUsers = [...currentUsers];
        newUsers[index] = { ...newUsers[index], [field]: value };
        setFieldValue('customizations.users', newUsers);
    };

    const addUserSshKey = (userIndex: number) => {
        const currentUsers = values.customizations.users || [];
        const user = currentUsers[userIndex];
        const currentKeys = user.sshKeys || [];
        const newUsers = [...currentUsers];
        newUsers[userIndex] = {
            ...user,
            sshKeys: [...currentKeys, ''],
        };
        setFieldValue('customizations.users', newUsers);
    };

    const removeUserSshKey = (userIndex: number, keyIndex: number) => {
        const currentUsers = values.customizations.users || [];
        const user = currentUsers[userIndex];
        const currentKeys = user.sshKeys || [];
        const newKeys = currentKeys.filter((_, i) => i !== keyIndex);
        const newUsers = [...currentUsers];
        newUsers[userIndex] = {
            ...user,
            sshKeys: newKeys,
        };
        setFieldValue('customizations.users', newUsers);
    };

    const updateUserSshKey = (userIndex: number, keyIndex: number, value: string) => {
        const currentUsers = values.customizations.users || [];
        const user = currentUsers[userIndex];
        const currentKeys = user.sshKeys || [];
        const newKeys = [...currentKeys];
        newKeys[keyIndex] = value;
        const newUsers = [...currentUsers];
        newUsers[userIndex] = {
            ...user,
            sshKeys: newKeys,
        };
        setFieldValue('customizations.users', newUsers);
    };

    const updateUserGroups = (userIndex: number, value: string) => {
        const currentUsers = values.customizations.users || [];
        const user = currentUsers[userIndex];
        const groups = value.split(',').map((g) => g.trim()).filter((g) => g.length > 0);
        const newUsers = [...currentUsers];
        newUsers[userIndex] = {
            ...user,
            groups,
        };
        setFieldValue('customizations.users', newUsers);
    };

    return (
        <Stack hasGutter>
            <StackItem>
                <Title headingLevel="h3" size="lg">
                    {t('SSH Keys')}
                </Title>
                <FormGroup
                    label={t('SSH public keys for root user')}
                    fieldId="sshKeys"
                >
                    {(values.customizations.sshKeys || []).map((key, index) => (
                        <div key={index} style={{ marginBottom: '12px' }}>
                            <TextArea
                                id={`ssh-key-${index}`}
                                value={key}
                                onChange={(_, value) => updateSshKey(index, value)}
                                placeholder={t('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAB...')}
                                rows={2}
                                style={{ marginBottom: '8px' }}
                            />
                            <Button
                                variant="plain"
                                icon={<TrashIcon />}
                                onClick={() => removeSshKey(index)}
                                aria-label={t('Remove SSH key')}
                            />
                        </div>
                    ))}
                    <Button variant="link" icon={<PlusCircleIcon />} onClick={addSshKey}>
                        {t('Add SSH key')}
                    </Button>
                </FormGroup>
            </StackItem>

            <StackItem>
                <Title headingLevel="h3" size="lg">
                    {t('Additional Users')}
                </Title>
                <FormGroup
                    label={t('Users')}
                    fieldId="users"
                >
                    {(values.customizations.users || []).map((user, userIndex) => (
                        <FormSection key={userIndex} style={{ marginBottom: '24px', padding: '16px', border: '1px solid #ccc' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <Title headingLevel="h4" size="md">
                                    {t('User {{index}}', { index: userIndex + 1 })}
                                </Title>
                                <Button
                                    variant="plain"
                                    icon={<TrashIcon />}
                                    onClick={() => removeUser(userIndex)}
                                    aria-label={t('Remove user')}
                                />
                            </div>

                            <FormGroup label={t('Username')} fieldId={`user-name-${userIndex}`} isRequired>
                                <input
                                    id={`user-name-${userIndex}`}
                                    type="text"
                                    value={user.name}
                                    onChange={(e) => updateUser(userIndex, 'name', e.target.value)}
                                    placeholder={t('username')}
                                    style={{ width: '100%', padding: '8px' }}
                                />
                            </FormGroup>

                            <FormGroup label={t('Password')} fieldId={`user-password-${userIndex}`}>
                                <input
                                    id={`user-password-${userIndex}`}
                                    type="password"
                                    value={user.password || ''}
                                    onChange={(e) => updateUser(userIndex, 'password', e.target.value)}
                                    placeholder={t('Optional password')}
                                    style={{ width: '100%', padding: '8px' }}
                                />
                            </FormGroup>

                            <FormGroup label={t('Groups')} fieldId={`user-groups-${userIndex}`}>
                                <input
                                    id={`user-groups-${userIndex}`}
                                    type="text"
                                    value={(user.groups || []).join(', ')}
                                    onChange={(e) => updateUserGroups(userIndex, e.target.value)}
                                    placeholder={t('wheel,sudo (comma-separated)')}
                                    style={{ width: '100%', padding: '8px' }}
                                />
                            </FormGroup>

                            <FormGroup label={t('Shell')} fieldId={`user-shell-${userIndex}`}>
                                <input
                                    id={`user-shell-${userIndex}`}
                                    type="text"
                                    value={user.shell || '/bin/bash'}
                                    onChange={(e) => updateUser(userIndex, 'shell', e.target.value)}
                                    placeholder={t('/bin/bash')}
                                    style={{ width: '100%', padding: '8px' }}
                                />
                            </FormGroup>

                            <FormGroup label={t('SSH Keys')} fieldId={`user-ssh-keys-${userIndex}`}>
                                {(user.sshKeys || []).map((key, keyIndex) => (
                                    <div key={keyIndex} style={{ marginBottom: '8px' }}>
                                        <TextArea
                                            id={`user-${userIndex}-ssh-key-${keyIndex}`}
                                            value={key}
                                            onChange={(_, value) => updateUserSshKey(userIndex, keyIndex, value)}
                                            placeholder={t('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAB...')}
                                            rows={2}
                                            style={{ marginBottom: '4px' }}
                                        />
                                        <Button
                                            variant="plain"
                                            icon={<TrashIcon />}
                                            onClick={() => removeUserSshKey(userIndex, keyIndex)}
                                            aria-label={t('Remove SSH key')}
                                        />
                                    </div>
                                ))}
                                <Button variant="link" icon={<PlusCircleIcon />} onClick={() => addUserSshKey(userIndex)}>
                                    {t('Add SSH key')}
                                </Button>
                            </FormGroup>
                        </FormSection>
                    ))}
                    <Button variant="link" icon={<PlusCircleIcon />} onClick={addUser}>
                        {t('Add user')}
                    </Button>
                </FormGroup>
            </StackItem>
        </Stack>
    );
};

export default SecurityStep;

