/*
 * Project: Frieren Framework
 * Module: MAC Allow-List (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import * as yup from 'yup';
import { toast } from 'react-toastify';
import PanelCard from '@src/components/PanelCard';
import FormProvider from '@src/components/Form/FormProvider';
import InputField from '@src/components/Form/InputField';
import SubmitButton from '@src/components/Form/SubmitButton';
import useAddMacMutation from '@module/feature/hooks/useAddMacMutation';

const MAC_PATTERN = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

const schema = yup.object({
    mac: yup.string()
        .required('MAC address is required')
        .matches(MAC_PATTERN, 'Must be a MAC address like AA:BB:CC:DD:EE:FF'),
});

const defaultValues = { mac: '' };

/**
 * Form card for adding a MAC address to the allow-list.
 *
 * @return {ReactElement} The rendered card.
 */
const AddMacCard = () => {
    const addMacMutation = useAddMacMutation();

    const handleSubmit = async ({ mac }, methods) => {
        await addMacMutation.mutateAsync(mac.toUpperCase());
        toast.success(`Added ${mac.toUpperCase()} to the allow-list`);
        methods.reset(defaultValues);
    };

    return (
        <PanelCard title={'Add MAC Address'} icon={'plus-circle'} showRefresh={false}>
            <FormProvider schema={schema} onSubmit={handleSubmit} defaultValues={defaultValues}>
                <InputField name={'mac'} label={'MAC Address'} placeholder={'AA:BB:CC:DD:EE:FF'} />
                <SubmitButton label={'Add to Allow-List'} />
            </FormProvider>
        </PanelCard>
    );
};

export default AddMacCard;
