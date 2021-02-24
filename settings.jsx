import { React, getModule, getModuleByDisplayName, contextMenu } from "@vizality/webpack"
import { Modal, Icon, Button, SearchBar, Anchor, Divider, Text, Avatar } from "@vizality/components"
import { TextInput, SwitchItem, ButtonItem, Category, SliderInput } from '@vizality/components/settings';

module.exports = class Settings extends React.PureComponent {
    constructor(props){
        super(props)
        this.state = {
            custom_opened: true,
            config_opened: true
        }
    }

    render() {
        return <>
            <Category name="Configuration" opened={this.state.config_opened} onChange={()=> this.setState({ config_opened: !this.state.config_opened})}>
                <SwitchItem
                note={"Only show pronouns on hover in user popouts."}
                value={this.props.getSetting("popoutHover", false)}
                onChange={()=> this.props.toggleSetting("popoutHover", true)}
                >Popout Require hover</SwitchItem>
            </Category>
        </>
    }
}