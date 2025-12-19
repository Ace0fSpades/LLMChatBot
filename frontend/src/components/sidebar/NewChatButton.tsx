import { useState } from 'react';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useAppDispatch } from '@/hooks/redux';
import { setCurrentSession } from '@/stores';
import { CreateChatModal } from '@/components/common';
import { handleError } from '@/utils/errorHandler';

/**
 * New chat button component
 */
export const NewChatButton = () => {
  const dispatch = useAppDispatch();
  const { createSession } = useChatHistory();
  const [showModal, setShowModal] = useState(false);

  /**
   * Handle creating new chat with title
   */
  const handleCreateChat = async (title: string) => {
    try {
      const session = await createSession({ title });
      if (session) {
        dispatch(setCurrentSession(session));
      }
    } catch (error) {
      handleError(error, 'Создание чата');
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-primary new-chat-button"
      >
        + Новый чат
      </button>
      <CreateChatModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreateChat}
      />
    </>
  );
};

