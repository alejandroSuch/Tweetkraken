import {configure}  from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import React from 'react';
import Searchbar from './searchbar';
import { mount, shallow } from "enzyme";
configure({ adapter: new Adapter() });

describe('Test Searchbar component', function () {
    const props = {
        setSearchStr : jest.fn(),
        searchStr : null,
        isLoading : false,
        searchError: null,
        inputSearch: {
            current: jest.fn()
        },
        searchBar: {
            current: jest.fn()
        }
    }
    let wrapper;

    beforeEach(() => {
        wrapper = mount(<Searchbar {...props}/>);
        props.setSearchStr.mockClear()
        props.inputSearch.current.mockClear()
        props.searchBar.current.mockClear()
    });    
    
    it('should render correctly', function () {
        expect(wrapper.getElements()).toMatchSnapshot();
    });

    it('should start with an empty input tag', function () {
        expect(wrapper.find(".searchbar-wrapper > input").text()).toEqual("");
    });

    it('should trigger with Enter keydown', function(){
        let input = wrapper.find('.searchbar-wrapper > input');
        input.simulate('keydown', { keyCode: 13, target: {value: 'Gitkraken'}})
        expect(props.setSearchStr).toHaveBeenCalled()
    });

    it('should NOT trigger with input changes', function(){
        let input = wrapper.find('.searchbar-wrapper > input');
        input.simulate('keydown', { key: 'l', target: {value: 'Marvel'}})
        expect(props.setSearchStr).not.toHaveBeenCalled()
    });

    it('should display error message if searchError is set', function(){
        wrapper.setProps({...props, searchError: 'Test error'});
        expect(wrapper.find('.error-desc').text()).toBe('Test error');
    });

    it('should NOT display error message if searchError is NOT set', function(){
        expect(wrapper.find('.error-desc').exists()).toBeFalsy();
    });

    it('should display loading icon if isLoading is set', function(){
        wrapper.setProps({...props, isLoading: true});
        expect(wrapper.find('.searchbar-wrapper > .indicators > .loading').exists()).toBeTruthy();
    });

    it('should NOT display loading icon if isLoading is NOT set', function(){
        expect(wrapper.find('.searchbar-wrapper > .indicators > .loading').exists()).toBeFalsy();
    });
});