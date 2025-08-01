-- RenameForeignKey
ALTER TABLE "ChatMessage" RENAME CONSTRAINT "ChatMessage_receiverId_admin_fkey" TO "fk_receiver_superadmin";

-- RenameForeignKey
ALTER TABLE "ChatMessage" RENAME CONSTRAINT "ChatMessage_receiverId_user_fkey" TO "fk_receiver_regularuser";

-- RenameForeignKey
ALTER TABLE "ChatMessage" RENAME CONSTRAINT "ChatMessage_senderId_admin_fkey" TO "fk_sender_superadmin";

-- RenameForeignKey
ALTER TABLE "ChatMessage" RENAME CONSTRAINT "ChatMessage_senderId_user_fkey" TO "fk_sender_regularuser";
