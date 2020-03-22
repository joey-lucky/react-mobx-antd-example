import ReactDOM from "react-dom";
import * as React from "react";
import 'antd/dist/antd.css';
import "./theme.less";
import * as styles from "./index.module.css";
import {Button} from "antd";
import {observable} from "mobx";
import {observer} from "mobx-react";

@observer
class App extends React.Component {
    @observable count = 0;

    onAddClick = (e) => {
        e.stopPropagation();
        this.count++;
    };

    render() {
        return (
            <div className={styles.container}>
                <h1>当前数值{this.count}</h1>
                <Button type={"primary"} onClick={this.onAddClick}>增加</Button>
            </div>
        );
    }
}

ReactDOM.render(
    <App/>,
    document.getElementById("root")
);
