import { View, ContentView } from 'ui/page';
import { LayoutBase } from 'ui/layouts/layout-base';

export class DomUtils {

    public static setControlInteractionState(view: View, isEnabled: boolean, isAndroid: boolean): void {
        view.isUserInteractionEnabled = isEnabled;
        if (isAndroid) {
            if (view.android instanceof android.widget.EditText) {
                let control = <android.widget.EditText>view.android;
                control.setCursorVisible(isEnabled);
            }
        }
        if (view instanceof ContentView) {
            DomUtils.setControlInteractionState((<ContentView>view).content, isEnabled, isAndroid);
        } else if (view instanceof LayoutBase) {
            let layoutBase = <LayoutBase>view;
            for (let i = 0, length = layoutBase.getChildrenCount(); i < length; i++) {
                let child = layoutBase.getChildAt(i);
                DomUtils.setControlInteractionState(child, isEnabled, isAndroid);
            }
        }
    }
}
