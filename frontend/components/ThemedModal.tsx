import { Modal, ModalProps, View } from "react-native";
import { vars } from "nativewind";
import { applyPalette } from "@/lib/theme";
import { useIsDark } from "@/stores/theme";

/** RN Modal renders outside the root view, so it must re-apply the theme CSS variables itself. */
export function ThemedModal({ children, ...props }: ModalProps) {
  const palette = vars(applyPalette(useIsDark()));
  return (
    <Modal {...props}>
      <View style={[{ flex: 1 }, palette]}>{children}</View>
    </Modal>
  );
}
