const { ui: { toasts } } = vendetta;

export default {
    onLoad: () => {
        toasts.showToast("BadgeGarcia Ativado com Sucesso!", { type: "success" });
        console.log("BadgeGarcia carregado no Kettu.");
    },
    onUnload: () => {
        toasts.showToast("BadgeGarcia Desativado.", { type: "info" });
    }
};
